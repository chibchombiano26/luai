import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminPage from './page';
import { TOOL_PROMPT_MAX_LENGTH } from '@/lib/platform/tool-prompts';

function buildCardsResponse() {
  return {
    assistantAvatarPreset: 'default',
    profileUiSettings: {
      showUsageSummary: true,
      showDailyUsageChart: true,
      showRecentTokenEvents: true,
    },
    cards: [
      {
        id: 'weather_forecast',
        category: 'weather',
        name: { es: 'Pronóstico del clima', en: 'Weather forecast' },
        description: {
          es: 'Consulta pronóstico y resumen climático usando un flujo Langflow.',
          en: 'Get weather forecast and summary through a Langflow flow.',
        },
        defaultEnabled: false,
        enabled: false,
        toolId: 'show_weather_forecast',
        langflowEndpoint: '/weather/forecast',
        config: { provider: 'open-meteo' },
      },
    ],
  };
}

function buildWeatherCardsResponseWithToolPrompt(enabled = true) {
  return {
    assistantAvatarPreset: 'default',
    profileUiSettings: {
      showUsageSummary: true,
      showDailyUsageChart: true,
      showRecentTokenEvents: true,
    },
    cards: [
      {
        id: 'weather_forecast',
        category: 'weather',
        name: { es: 'Pronóstico del clima', en: 'Weather forecast' },
        description: {
          es: 'Consulta pronóstico y resumen climático usando un flujo Langflow.',
          en: 'Get weather forecast and summary through a Langflow flow.',
        },
        defaultEnabled: false,
        enabled,
        toolId: 'show_weather_forecast',
        config: {
          toolPrompts: {
            show_weather_forecast: 'usa respuestas muy cortas',
          },
        },
      },
    ],
  };
}

function buildUnknownCardResponse() {
  return {
    assistantAvatarPreset: 'default',
    profileUiSettings: {
      showUsageSummary: true,
      showDailyUsageChart: true,
      showRecentTokenEvents: true,
    },
    cards: [
      {
        id: 'custom_card',
        category: 'custom',
        name: { es: 'Card personalizado', en: 'Custom card' },
        description: {
          es: 'Card sin comandos ni prompts configurables.',
          en: 'Card without configurable prompts or commands.',
        },
        defaultEnabled: true,
        enabled: true,
        toolId: 'custom_tool',
        config: { someSetting: true },
      },
    ],
  };
}

describe('AdminPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    document.cookie = '';
  });

  it('loads card configuration and renders toggle + json editor per card', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => buildCardsResponse(),
      })
    );

    render(<AdminPage />);

    expect(screen.getByText(/cargando configuraci.n/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/cards disponibles/i)).toBeInTheDocument();
      expect(screen.getByText(/widgets core del perfil/i)).toBeInTheDocument();
      expect(screen.getByText(/pron.stico del clima/i)).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /pron.stico del clima activo/i })).toBeInTheDocument();
    });

    expect(screen.queryByDisplayValue(/"provider": "open-meteo"/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /pron.stico del clima expand/i }));

    expect(screen.getByDisplayValue(/"provider": "open-meteo"/i)).toBeInTheDocument();
  });

  it('shows load error when GET /api/platform/cards fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({ ok: false })
    );

    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText(/error al cargar configuraci.n/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when there are no cards configured', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ cards: [] }),
      })
    );

    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByText(/no hay cards configurados/i)).toBeInTheDocument();
    });
  });

  it('saves enabled state and json config per card', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildCardsResponse(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
    );

    render(<AdminPage />);

    await waitFor(() =>
      expect(screen.getByRole('switch', { name: /pron.stico del clima activo/i })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole('switch', { name: /pron.stico del clima activo/i }));
    fireEvent.click(screen.getByRole('button', { name: /pron.stico del clima expand/i }));

    const jsonArea = screen.getByDisplayValue(/"provider": "open-meteo"/i);
    fireEvent.change(jsonArea, {
      target: { value: '{"provider":"openweather","units":"metric"}' },
    });

    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(screen.getByText(/configuraci.n guardada/i)).toBeInTheDocument();
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    const postCall = vi.mocked(fetch).mock.calls[1];
    const requestInit = postCall[1] as RequestInit;
    const payload = JSON.parse(requestInit.body as string) as {
      enabledByCardId: Record<string, boolean>;
      configByCardId: Record<string, Record<string, unknown>>;
      profileUiSettings: Record<string, boolean>;
    };

    expect(payload.enabledByCardId.weather_forecast).toBe(true);
    expect(payload.configByCardId.weather_forecast).toMatchObject({
      provider: 'openweather',
      units: 'metric',
      enabledCommands: ['weather_forecast'],
    });
    expect(payload.profileUiSettings).toEqual({
      showUsageSummary: true,
      showDailyUsageChart: true,
      showRecentTokenEvents: true,
    });
    expect(payload.configByCardId.weather_forecast.systemPromptByLocale).toBeTruthy();
  });

  it('persists profile widget visibility from admin', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildCardsResponse(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
    );

    render(<AdminPage />);

    await waitFor(() => expect(screen.getByText(/widgets core del perfil/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('switch', { name: /resumen de tokens/i }));
    fireEvent.click(screen.getByRole('switch', { name: /ultimos eventos de tokens/i }));
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    const postCall = vi.mocked(fetch).mock.calls[1];
    const requestInit = postCall[1] as RequestInit;
    const payload = JSON.parse(requestInit.body as string) as {
      profileUiSettings: Record<string, boolean>;
    };

    expect(payload.profileUiSettings).toEqual({
      showUsageSummary: false,
      showDailyUsageChart: true,
      showRecentTokenEvents: false,
    });
  });

  it('persists the second global AI avatar preset from admin', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildCardsResponse(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
    );

    render(<AdminPage />);

    await waitFor(() => expect(screen.getByText(/avatar global de la ai/i)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /avatar personalizado 2/i }));
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    const postCall = vi.mocked(fetch).mock.calls[1];
    const requestInit = postCall[1] as RequestInit;
    const payload = JSON.parse(requestInit.body as string) as {
      assistantAvatarPreset: string;
    };

    expect(payload.assistantAvatarPreset).toBe('mascot_alt');
  });

  it('allows disabling commands per card and persists enabledCommands list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildCardsResponse(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
    );

    render(<AdminPage />);

    await waitFor(() =>
      expect(
        screen.getByRole('switch', { name: /pron.stico del clima activo/i })
      ).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole('button', { name: /pron.stico del clima expand/i }));
    const commandToggle = screen.getByTestId('command-toggle-weather_forecast-weather_forecast');
    expect(commandToggle).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    const postCall = vi.mocked(fetch).mock.calls[1];
    const requestInit = postCall[1] as RequestInit;
    const payload = JSON.parse(requestInit.body as string) as {
      enabledByCardId: Record<string, boolean>;
      configByCardId: Record<string, Record<string, unknown>>;
    };

    expect(payload.enabledByCardId.weather_forecast).toBe(false);
    expect(payload.configByCardId.weather_forecast).toMatchObject({
      provider: 'open-meteo',
      enabledCommands: [],
    });
    expect(payload.configByCardId.weather_forecast.systemPromptByLocale).toBeTruthy();
  });

  it('turns command toggles off visually when parent card is disabled', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => buildCardsResponse(),
      })
    );

    render(<AdminPage />);

    await waitFor(() =>
      expect(
        screen.getByRole('switch', { name: /pron.stico del clima activo/i })
      ).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: /pron.stico del clima expand/i }));

    const commandToggle = screen.getByTestId('command-toggle-weather_forecast-weather_forecast');
    expect(commandToggle).toHaveAttribute('aria-checked', 'false');
    expect(commandToggle).toBeDisabled();
  });

  it('saves tool prompts per tool from admin and enforces max length in the UI', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildWeatherCardsResponseWithToolPrompt(true),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
    );

    render(<AdminPage />);

    await waitFor(() =>
      expect(screen.getByRole('switch', { name: /pron.stico del clima activo/i })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: /pron.stico del clima expand/i }));

    const promptInput = screen.getByTestId('tool-prompt-weather_forecast-show_weather_forecast') as HTMLTextAreaElement;
    expect(promptInput.value).toBe('usa respuestas muy cortas');
    expect(promptInput.maxLength).toBe(TOOL_PROMPT_MAX_LENGTH);

    fireEvent.change(promptInput, {
      target: { value: 'pide placa y aseguradora, luego responde en una sola frase' },
    });
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    const postCall = vi.mocked(fetch).mock.calls[1];
    const requestInit = postCall[1] as RequestInit;
    const payload = JSON.parse(requestInit.body as string) as {
      enabledByCardId: Record<string, boolean>;
      configByCardId: Record<string, Record<string, unknown>>;
    };

    expect(payload.configByCardId.weather_forecast.toolPrompts).toEqual({
      show_weather_forecast: {
        es: 'pide placa y aseguradora, luego responde en una sola frase',
        en: 'usa respuestas muy cortas',
      },
    });
  });

  it('requires card system prompt (es/en) before saving', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => buildCardsResponse(),
      })
    );

    render(<AdminPage />);

    await waitFor(() =>
      expect(
        screen.getByRole('switch', { name: /pron.stico del clima activo/i })
      ).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: /pron.stico del clima expand/i }));

    const systemPromptInput = screen.getByTestId('system-prompt-weather_forecast-es');
    fireEvent.change(systemPromptInput, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(screen.getByText(/system prompt del card es obligatorio/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when a card json is invalid', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => buildCardsResponse(),
      })
    );

    render(<AdminPage />);

    await waitFor(() =>
      expect(screen.getByRole('switch', { name: /pron.stico del clima activo/i })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: /pron.stico del clima expand/i }));

    const jsonArea = screen.getByDisplayValue(/"provider": "open-meteo"/i);
    fireEvent.change(jsonArea, {
      target: { value: '{invalid-json' },
    });

    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(screen.getByText(/json inv.lido para el card/i)).toBeInTheDocument();
    });
  });

  it('shows non-flow fallback sections for cards without platform metadata', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => buildUnknownCardResponse(),
      })
    );

    render(<AdminPage />);

    await waitFor(() =>
      expect(screen.getByRole('switch', { name: /card personalizado activo/i })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: /card personalizado expand/i }));

    expect(screen.getByText(/este card no tiene endpoints configurables/i)).toBeInTheDocument();
    expect(screen.getByText(/este card no tiene comandos slash asociados/i)).toBeInTheDocument();
    expect(
      screen.getByText(/este card no tiene herramientas configurables para prompt/i)
    ).toBeInTheDocument();
    expect(screen.queryByTestId('system-prompt-custom_card-es')).not.toBeInTheDocument();
  });

  it('shows save error when POST /api/platform/cards fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildCardsResponse(),
        })
        .mockResolvedValueOnce({
          ok: false,
        })
    );

    render(<AdminPage />);

    await waitFor(() =>
      expect(screen.getByRole('switch', { name: /pron.stico del clima activo/i })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to save cards configuration/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when tool prompt exceeds max length after trimming', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => buildWeatherCardsResponseWithToolPrompt(true),
      })
    );

    render(<AdminPage />);

    await waitFor(() =>
      expect(screen.getByRole('switch', { name: /pron.stico del clima activo/i })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole('button', { name: /pron.stico del clima expand/i }));

    fireEvent.change(screen.getByTestId('tool-prompt-weather_forecast-show_weather_forecast'), {
      target: { value: ` ${'x'.repeat(TOOL_PROMPT_MAX_LENGTH + 1)} ` },
    });
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    await waitFor(() => {
      expect(screen.getByText(/el prompt de herramienta excede/i)).toBeInTheDocument();
    });
  });

  it('switches locale to english and persists user preference', async () => {
    localStorage.setItem('luai_locale', 'en');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => buildCardsResponse(),
      })
    );

    render(<AdminPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /card configuration/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'ES' }));
    expect(localStorage.getItem('luai_locale')).toBe('es');
    expect(document.cookie).toContain('app_locale=es');

    expect(screen.getByRole('heading', { name: /configuraci.n de cards/i })).toBeInTheDocument();
  });
});
