import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminAiProvidersPage from './page';

function buildProvidersResponse() {
  return {
    providers: [
      {
        id: 'gemini',
        label: { es: 'Google Gemini', en: 'Google Gemini' },
        configured: true,
        hasStoredSecret: true,
        configuredVia: 'admin',
        updatedAt: '2026-03-05T12:00:00.000Z',
      },
    ],
  };
}

function createJsonResponse(payload: unknown, ok: boolean = true) {
  return {
    ok,
    json: async () => payload,
  };
}

describe('AdminAiProvidersPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    document.cookie = '';
  });

  it('loads and renders provider status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(createJsonResponse(buildProvidersResponse()))
    );

    render(<AdminAiProvidersPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /proveedores ai/i })).toBeInTheDocument();
      expect(screen.getByText('Google Gemini')).toBeInTheDocument();
      expect(screen.getByText(/configurado desde admin/i)).toBeInTheDocument();
      expect(screen.getByText(/ya existe una key guardada/i)).toBeInTheDocument();
    });

    expect(screen.getByTestId('provider-key-input-gemini')).toHaveValue('');
    expect(screen.getByTestId('delete-provider-gemini')).toBeInTheDocument();
  });

  it('saves a new provider key without revealing it again', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === 'POST') {
          return createJsonResponse({
            success: true,
            provider: {
              id: 'gemini',
              label: { es: 'Google Gemini', en: 'Google Gemini' },
              configured: true,
              hasStoredSecret: true,
              configuredVia: 'admin',
              updatedAt: '2026-03-05T13:00:00.000Z',
            },
          });
        }

        return createJsonResponse(buildProvidersResponse());
      })
    );

    render(<AdminAiProvidersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('provider-key-input-gemini')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('provider-key-input-gemini'), {
      target: { value: 'super-secret-gemini-key' },
    });
    fireEvent.click(screen.getByTestId('save-provider-gemini'));

    await waitFor(() => {
      expect(screen.getByText(/^key guardada ✓$/i)).toBeInTheDocument();
    });

    const postCall = vi
      .mocked(fetch)
      .mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method === 'POST');
    if (!postCall) {
      throw new Error('Expected a POST request for provider save');
    }
    const requestInit = postCall[1] as RequestInit;
    expect(JSON.parse(requestInit.body as string)).toEqual({
      providerId: 'gemini',
      apiKey: 'super-secret-gemini-key',
    });
    expect(screen.getByTestId('provider-key-input-gemini')).toHaveValue('');
    expect(screen.queryByDisplayValue('super-secret-gemini-key')).not.toBeInTheDocument();
  });

  it('deletes a saved provider key without ever showing the stored value', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === 'DELETE') {
          return createJsonResponse({
            success: true,
            provider: {
              id: 'gemini',
              label: { es: 'Google Gemini', en: 'Google Gemini' },
              configured: false,
              hasStoredSecret: false,
              configuredVia: null,
              updatedAt: null,
            },
          });
        }

        return createJsonResponse(buildProvidersResponse());
      })
    );

    render(<AdminAiProvidersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('delete-provider-gemini')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('delete-provider-gemini'));

    await waitFor(() => {
      expect(screen.getByText(/^key eliminada ✓$/i)).toBeInTheDocument();
      expect(screen.queryByText(/ya existe una key guardada/i)).not.toBeInTheDocument();
    });

    const deleteCall = vi
      .mocked(fetch)
      .mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method === 'DELETE');
    if (!deleteCall) {
      throw new Error('Expected a DELETE request for provider removal');
    }
    const requestInit = deleteCall[1] as RequestInit;
    expect(requestInit.method).toBe('DELETE');
    expect(JSON.parse(requestInit.body as string)).toEqual({
      providerId: 'gemini',
    });
  });

  it('shows load error when provider request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(createJsonResponse({ error: 'AI providers unavailable' }, false))
    );
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<AdminAiProvidersPage />);

    await waitFor(() => {
      expect(screen.getByText(/ai providers unavailable/i)).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('shows save error when provider key save fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === 'POST') {
          return createJsonResponse({ error: 'Save rejected' }, false);
        }

        return createJsonResponse(buildProvidersResponse());
      })
    );
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<AdminAiProvidersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('provider-key-input-gemini')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('provider-key-input-gemini'), {
      target: { value: 'another-secret' },
    });
    fireEvent.click(screen.getByTestId('save-provider-gemini'));

    await waitFor(() => {
      expect(screen.getByText(/save rejected/i)).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('switches locale to english and persists preference', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(createJsonResponse(buildProvidersResponse()))
    );

    render(<AdminAiProvidersPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /proveedores ai/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'EN' }));

    expect(localStorage.getItem('luai_locale')).toBe('en');
    expect(document.cookie).toContain('app_locale=en');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /ai providers/i })).toBeInTheDocument();
      expect(screen.getByText(/configured in admin/i)).toBeInTheDocument();
      expect(screen.getByText(/a saved key already exists/i)).toBeInTheDocument();
    });
  });
});
