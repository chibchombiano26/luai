import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getRepositories } from '@/lib/repositories/repository-factory';
import {
  getProfileUiSettings,
  saveProfileUiSettings,
  sanitizeProfileUiSettings,
} from './ui-settings';

vi.mock('@/lib/repositories/repository-factory', () => ({
  getRepositories: vi.fn(),
}));

function buildPlatformSettingsMock() {
  return {
    findById: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined),
  };
}

describe('profile ui settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns defaults and persists them when row is missing', async () => {
    const platformSettings = buildPlatformSettingsMock();
    vi.mocked(getRepositories).mockResolvedValue({ platformSettings } as never);

    const settings = await getProfileUiSettings();

    expect(settings).toEqual({
      showUsageSummary: true,
      showDailyUsageChart: true,
      showRecentTokenEvents: true,
    });
    expect(platformSettings.save).toHaveBeenCalledWith(
      'profile_ui_settings',
      JSON.stringify(settings)
    );
  });

  it('sanitizes persisted data and saves sanitized values', async () => {
    const platformSettings = buildPlatformSettingsMock();
    platformSettings.findById.mockResolvedValue({
      id: 'profile_ui_settings',
      config: JSON.stringify({
        showUsageSummary: false,
        showDailyUsageChart: 'yes',
      }),
    });
    vi.mocked(getRepositories).mockResolvedValue({ platformSettings } as never);

    await expect(getProfileUiSettings()).resolves.toEqual({
      showUsageSummary: false,
      showDailyUsageChart: true,
      showRecentTokenEvents: true,
    });

    await expect(
      saveProfileUiSettings({
        showUsageSummary: false,
        showDailyUsageChart: false,
        showRecentTokenEvents: true,
      })
    ).resolves.toEqual({
      showUsageSummary: false,
      showDailyUsageChart: false,
      showRecentTokenEvents: true,
    });
  });

  it('falls back to defaults on invalid shapes', () => {
    expect(sanitizeProfileUiSettings(null)).toEqual({
      showUsageSummary: true,
      showDailyUsageChart: true,
      showRecentTokenEvents: true,
    });
  });

  it('falls back to defaults when stored json is invalid', async () => {
    const platformSettings = buildPlatformSettingsMock();
    platformSettings.findById.mockResolvedValue({
      id: 'profile_ui_settings',
      config: '{bad-json',
    });
    vi.mocked(getRepositories).mockResolvedValue({ platformSettings } as never);

    await expect(getProfileUiSettings()).resolves.toEqual({
      showUsageSummary: true,
      showDailyUsageChart: true,
      showRecentTokenEvents: true,
    });
  });
});
