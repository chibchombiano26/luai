import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';
import { getResolvedFlowCards, saveFlowCardSettings } from '@/lib/platform/settings';
import { getProfileUiSettings, saveProfileUiSettings } from '@/lib/profile/ui-settings';
import { getAssistantAvatarPreset, saveAssistantAvatarPreset } from '@/lib/profile/avatar-settings';
import { isClerkAuthEnabled } from '@/lib/auth';
import { auth as clerkAuth, clerkClient as clerkServerClient } from '@clerk/nextjs/server';
import { FLOW_CARD_DEFINITIONS } from '@/lib/platform/cards';

vi.mock('@/lib/platform/settings', () => ({
  getResolvedFlowCards: vi.fn(),
  saveFlowCardSettings: vi.fn(),
}));

vi.mock('@/lib/profile/ui-settings', () => ({
  getProfileUiSettings: vi.fn(),
  saveProfileUiSettings: vi.fn(),
  sanitizeProfileUiSettings: vi.fn((value) => value),
}));

vi.mock('@/lib/profile/avatar-settings', () => ({
  getAssistantAvatarPreset: vi.fn(),
  saveAssistantAvatarPreset: vi.fn(),
  sanitizeAssistantAvatarPreset: vi.fn((value) => value),
}));

vi.mock('@/lib/auth', () => ({
  isClerkAuthEnabled: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}));

describe('Platform cards API', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
    vi.mocked(isClerkAuthEnabled).mockReturnValue(false);
    vi.mocked(getProfileUiSettings).mockResolvedValue({
      showUsageSummary: true,
      showDailyUsageChart: true,
      showRecentTokenEvents: true,
    });
    vi.mocked(getAssistantAvatarPreset).mockResolvedValue('default');
    vi.mocked(saveProfileUiSettings).mockResolvedValue({
      showUsageSummary: true,
      showDailyUsageChart: true,
      showRecentTokenEvents: true,
    });
    vi.mocked(saveAssistantAvatarPreset).mockResolvedValue('default');
    vi.mocked(clerkAuth).mockResolvedValue({ userId: 'user_admin' } as never);
    vi.mocked(clerkServerClient).mockResolvedValue({
      users: {
        getUser: vi.fn().mockResolvedValue({ publicMetadata: { role: 'admin' } }),
      },
    } as never);
  });

  function buildConfigByCardId() {
    return Object.fromEntries(
      FLOW_CARD_DEFINITIONS.map((card) => [
        card.id,
        {
          systemPromptByLocale: {
            es: `${card.id} prompt es`,
            en: `${card.id} prompt en`,
          },
        },
      ])
    );
  }

  it('GET returns resolved cards without sensitive config by default', async () => {
    vi.mocked(getResolvedFlowCards).mockResolvedValueOnce([
      {
        id: 'weather_forecast',
        category: 'weather',
        name: { es: 'Pronóstico', en: 'Forecast' },
        description: { es: 'Desc', en: 'Desc' },
        defaultEnabled: false,
        enabled: true,
        toolId: 'show_weather_forecast',
        langflowEndpoint: '/weather/forecast',
        config: {
          enabledCommands: ['weather_forecast'],
          systemPromptByLocale: { es: 'privado', en: 'private' },
        },
      },
    ] as never);

    const response = await GET(new Request('http://localhost/api/platform/cards'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      profileUiSettings: {
        showUsageSummary: true,
        showDailyUsageChart: true,
        showRecentTokenEvents: true,
      },
      assistantAvatarPreset: 'default',
      cards: [
        expect.objectContaining({
          id: 'weather_forecast',
          enabled: true,
          config: { enabledCommands: ['weather_forecast'] },
        }),
      ],
    });
  });

  it('GET includeConfig requires authentication when no auth is configured', async () => {
    const response = await GET(new Request('http://localhost/api/platform/cards?includeConfig=1'));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      error: 'Authentication must be configured to manage platform cards',
    });
  });

  it('GET includeConfig allows access in explicit noauth development mode', async () => {
    process.env.CLERK_AUTH_ENABLED = 'false';
    process.env.BASIC_AUTH_ENABLED = 'false';
    vi.mocked(getResolvedFlowCards).mockResolvedValueOnce([
      {
        id: 'weather_forecast',
        category: 'weather',
        name: { es: 'Pronóstico', en: 'Forecast' },
        description: { es: 'Desc', en: 'Desc' },
        defaultEnabled: false,
        enabled: true,
        toolId: 'show_weather_forecast',
        langflowEndpoint: '/weather/forecast',
        config: {
          enabledCommands: ['weather_forecast'],
          systemPromptByLocale: { es: 'privado', en: 'private' },
        },
      },
    ] as never);

    const response = await GET(new Request('http://localhost/api/platform/cards?includeConfig=1'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.cards[0]).toEqual(
      expect.objectContaining({
        id: 'weather_forecast',
        config: expect.objectContaining({
          systemPromptByLocale: { es: 'privado', en: 'private' },
        }),
      })
    );
  });

  it('POST validates and saves card settings with basic auth', async () => {
    process.env.BASIC_AUTH_ENABLED = 'true';
    process.env.BASIC_AUTH_USERNAME = 'admin';
    process.env.BASIC_AUTH_PASSWORD = 'secret';

    const configByCardId = {
      ...buildConfigByCardId(),
      weather_forecast: {
        provider: 'openweather',
        systemPromptByLocale: { es: 'Clima', en: 'Weather' },
      },
    };

    vi.mocked(saveFlowCardSettings).mockResolvedValueOnce({
      enabledByCardId: {
        weather_forecast: true,
      },
      configByCardId,
    });
    vi.mocked(saveProfileUiSettings).mockResolvedValueOnce({
      showUsageSummary: false,
      showDailyUsageChart: true,
      showRecentTokenEvents: false,
    });
    vi.mocked(saveAssistantAvatarPreset).mockResolvedValueOnce('mascot');

    const response = await POST(
      new Request('http://localhost/api/platform/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Basic ${Buffer.from('admin:secret').toString('base64')}`,
        },
        body: JSON.stringify({
          enabledByCardId: {
            weather_forecast: true,
            unknown: true,
          },
          configByCardId,
          profileUiSettings: {
            showUsageSummary: false,
            showDailyUsageChart: true,
            showRecentTokenEvents: false,
          },
          assistantAvatarPreset: 'mascot',
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(saveFlowCardSettings).toHaveBeenCalledWith({
      enabledByCardId: {
        weather_forecast: true,
      },
      configByCardId,
    });
    expect(saveProfileUiSettings).toHaveBeenCalledWith({
      showUsageSummary: false,
      showDailyUsageChart: true,
      showRecentTokenEvents: false,
    });
    expect(saveAssistantAvatarPreset).toHaveBeenCalledWith('mascot');
    expect(body).toEqual({
      success: true,
      settings: {
        enabledByCardId: {
          weather_forecast: true,
        },
        configByCardId,
      },
      profileUiSettings: {
        showUsageSummary: false,
        showDailyUsageChart: true,
        showRecentTokenEvents: false,
      },
      assistantAvatarPreset: 'mascot',
    });
  });

  it('POST requires authentication when no auth is configured', async () => {
    const response = await POST(
      new Request('http://localhost/api/platform/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabledByCardId: {},
          configByCardId: buildConfigByCardId(),
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      error: 'Authentication must be configured to manage platform cards',
    });
    expect(saveFlowCardSettings).not.toHaveBeenCalled();
  });

  it('POST allows saving in explicit noauth development mode', async () => {
    process.env.CLERK_AUTH_ENABLED = 'false';
    process.env.BASIC_AUTH_ENABLED = 'false';

    const configByCardId = buildConfigByCardId();
    vi.mocked(saveFlowCardSettings).mockResolvedValueOnce({
      enabledByCardId: {
        weather_forecast: true,
      },
      configByCardId,
    });

    const response = await POST(
      new Request('http://localhost/api/platform/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabledByCardId: {
            weather_forecast: true,
          },
          configByCardId,
          profileUiSettings: {
            showUsageSummary: true,
            showDailyUsageChart: true,
            showRecentTokenEvents: true,
          },
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(saveFlowCardSettings).toHaveBeenCalled();
  });

  it('POST requires configuration entries for every existing card', async () => {
    process.env.BASIC_AUTH_ENABLED = 'true';
    process.env.BASIC_AUTH_USERNAME = 'admin';
    process.env.BASIC_AUTH_PASSWORD = 'secret';

    const response = await POST(
      new Request('http://localhost/api/platform/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Basic ${Buffer.from('admin:secret').toString('base64')}`,
        },
        body: JSON.stringify({
          enabledByCardId: {
            weather_forecast: true,
          },
          configByCardId: {},
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual(
      expect.objectContaining({
        error: 'Missing required card system prompt',
      })
    );
  });

  it('POST returns 400 on invalid payload', async () => {
    process.env.BASIC_AUTH_ENABLED = 'true';
    process.env.BASIC_AUTH_USERNAME = 'admin';
    process.env.BASIC_AUTH_PASSWORD = 'secret';

    const response = await POST(
      new Request('http://localhost/api/platform/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Basic ${Buffer.from('admin:secret').toString('base64')}`,
        },
        body: JSON.stringify({ enabledByCardId: 'invalid' }),
      })
    );

    expect(response.status).toBe(400);
  });

  it('POST returns 403 when Clerk user is not admin', async () => {
    vi.mocked(isClerkAuthEnabled).mockReturnValueOnce(true);
    vi.mocked(clerkAuth).mockResolvedValueOnce({ userId: 'user_viewer' } as never);
    vi.mocked(clerkServerClient).mockResolvedValueOnce({
      users: {
        getUser: vi.fn().mockResolvedValue({ publicMetadata: { role: 'viewer' } }),
      },
    } as never);

    const response = await POST(
      new Request('http://localhost/api/platform/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabledByCardId: {
            weather_forecast: true,
          },
          configByCardId: {
            weather_forecast: {
              systemPromptByLocale: { es: 'Clima', en: 'Weather' },
            },
          },
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'Admin privileges required' });
    expect(saveFlowCardSettings).not.toHaveBeenCalled();
  });
});
