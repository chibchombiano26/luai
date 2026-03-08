import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getRepositories } from '@/lib/repositories/repository-factory';
import {
  getEnabledFlowCardIdSet,
  getFlowCardSettings,
  getResolvedFlowCards,
  saveFlowCardSettings,
} from './settings';

vi.mock('@/lib/repositories/repository-factory', () => ({
  getRepositories: vi.fn(),
}));

function buildPlatformSettingsMock() {
  return {
    findById: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined),
  };
}

describe('platform settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns default settings and persists them when row is missing', async () => {
    const platformSettings = buildPlatformSettingsMock();
    vi.mocked(getRepositories).mockResolvedValue({ platformSettings } as never);

    const settings = await getFlowCardSettings();

    expect(settings).toEqual({ enabledByCardId: {}, configByCardId: {} });
    expect(platformSettings.save).toHaveBeenCalledWith(
      'flow_card_settings',
      JSON.stringify({ enabledByCardId: {}, configByCardId: {} })
    );
  });

  it('parses stored settings and falls back on invalid data', async () => {
    const platformSettings = buildPlatformSettingsMock();
    platformSettings.findById
      .mockResolvedValueOnce({
        id: 'flow_card_settings',
        config: JSON.stringify({
          enabledByCardId: { weather_forecast: true, unknown: true },
          configByCardId: { weather_forecast: { units: 'metric' } },
        }),
      })
      .mockResolvedValueOnce({ id: 'flow_card_settings', config: '{bad-json' })
      .mockResolvedValueOnce({ id: 'flow_card_settings', config: 123 as never });
    vi.mocked(getRepositories).mockResolvedValue({ platformSettings } as never);

    await expect(getFlowCardSettings()).resolves.toEqual({
      enabledByCardId: { weather_forecast: true },
      configByCardId: { weather_forecast: { units: 'metric' } },
    });
    await expect(getFlowCardSettings()).resolves.toEqual({
      enabledByCardId: {},
      configByCardId: {},
    });
    await expect(getFlowCardSettings()).resolves.toEqual({
      enabledByCardId: {},
      configByCardId: {},
    });
  });

  it('saves sanitized settings', async () => {
    const platformSettings = buildPlatformSettingsMock();
    vi.mocked(getRepositories).mockResolvedValue({ platformSettings } as never);

    const sanitized = await saveFlowCardSettings({
      enabledByCardId: {
        weather_forecast: true,
      },
      configByCardId: {
        weather_forecast: { units: 'metric' },
        unknown: { ignored: true },
      },
    });

    expect(sanitized).toEqual({
      enabledByCardId: { weather_forecast: true },
      configByCardId: { weather_forecast: { units: 'metric' } },
    });
    expect(platformSettings.save).toHaveBeenCalledWith(
      'flow_card_settings',
      JSON.stringify(sanitized)
    );
  });

  it('resolves cards and enabled card sets from persisted settings', async () => {
    const platformSettings = buildPlatformSettingsMock();
    platformSettings.findById.mockResolvedValue({
      id: 'flow_card_settings',
      config: JSON.stringify({
        enabledByCardId: {
          weather_forecast: true,
        },
        configByCardId: {
          weather_forecast: { units: 'metric' },
        },
      }),
    });
    vi.mocked(getRepositories).mockResolvedValue({ platformSettings } as never);

    await expect(getResolvedFlowCards()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'weather_forecast',
          enabled: true,
          config: { units: 'metric' },
        }),
      ])
    );

    const enabledCardIds = await getEnabledFlowCardIdSet();
    expect(enabledCardIds).toEqual(expect.any(Set));
    expect(enabledCardIds.has('weather_forecast')).toBe(true);
  });
});
