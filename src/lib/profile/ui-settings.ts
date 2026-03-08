import { getRepositories } from '@/lib/repositories/repository-factory';

export interface ProfileUiSettings {
  showUsageSummary: boolean;
  showDailyUsageChart: boolean;
  showRecentTokenEvents: boolean;
}

const PROFILE_UI_SETTINGS_ROW_ID = 'profile_ui_settings';

const DEFAULT_PROFILE_UI_SETTINGS: ProfileUiSettings = {
  showUsageSummary: true,
  showDailyUsageChart: true,
  showRecentTokenEvents: true,
};

function sanitizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function sanitizeProfileUiSettings(value: unknown): ProfileUiSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...DEFAULT_PROFILE_UI_SETTINGS };
  }

  const candidate = value as Record<string, unknown>;
  return {
    showUsageSummary: sanitizeBoolean(
      candidate.showUsageSummary,
      DEFAULT_PROFILE_UI_SETTINGS.showUsageSummary
    ),
    showDailyUsageChart: sanitizeBoolean(
      candidate.showDailyUsageChart,
      DEFAULT_PROFILE_UI_SETTINGS.showDailyUsageChart
    ),
    showRecentTokenEvents: sanitizeBoolean(
      candidate.showRecentTokenEvents,
      DEFAULT_PROFILE_UI_SETTINGS.showRecentTokenEvents
    ),
  };
}

export async function getProfileUiSettings(): Promise<ProfileUiSettings> {
  const { platformSettings } = await getRepositories();
  const row = await platformSettings.findById(PROFILE_UI_SETTINGS_ROW_ID);

  if (!row) {
    await platformSettings.save(
      PROFILE_UI_SETTINGS_ROW_ID,
      JSON.stringify(DEFAULT_PROFILE_UI_SETTINGS)
    );
    return { ...DEFAULT_PROFILE_UI_SETTINGS };
  }

  try {
    return sanitizeProfileUiSettings(JSON.parse(row.config));
  } catch {
    return { ...DEFAULT_PROFILE_UI_SETTINGS };
  }
}

export async function saveProfileUiSettings(
  settings: ProfileUiSettings
): Promise<ProfileUiSettings> {
  const sanitized = sanitizeProfileUiSettings(settings);
  const { platformSettings } = await getRepositories();
  await platformSettings.save(PROFILE_UI_SETTINGS_ROW_ID, JSON.stringify(sanitized));
  return sanitized;
}

