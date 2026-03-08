import { getRepositories } from '@/lib/repositories/repository-factory';
import {
  isAssistantAvatarPreset,
  resolveAssistantAvatarPresetImageUrl,
  type AssistantAvatarPreset,
} from './avatar-config';
import type { ProfileAvatarSettings } from './types';

const ASSISTANT_AVATAR_SETTINGS_ROW_ID = 'assistant_avatar_settings';
const USER_AVATAR_SETTINGS_ROW_PREFIX = 'profile_avatar_settings:';
const MAX_DATA_URL_LENGTH = 350_000;
const IMAGE_DATA_URL_PATTERN =
  /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[a-z0-9+/=\s]+$/i;

export interface StoredUserAvatarSettings {
  assistantCustomDataUrl: string | null;
  userCustomDataUrl: string | null;
}

function resolveUserAvatarSettingsRowId(username: string | null): string {
  const normalizedUsername = (username ?? 'anonymous').trim() || 'anonymous';
  return `${USER_AVATAR_SETTINGS_ROW_PREFIX}${encodeURIComponent(normalizedUsername)}`;
}

function sanitizeImageDataUrl(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  if (!normalized || normalized.length > MAX_DATA_URL_LENGTH) {
    return null;
  }

  return IMAGE_DATA_URL_PATTERN.test(normalized) ? normalized : null;
}

export function sanitizeAssistantAvatarPreset(value: unknown): AssistantAvatarPreset {
  return isAssistantAvatarPreset(value) ? value : 'default';
}

export function sanitizeStoredUserAvatarSettings(value: unknown): StoredUserAvatarSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {
      assistantCustomDataUrl: null,
      userCustomDataUrl: null,
    };
  }

  const candidate = value as Record<string, unknown>;
  return {
    assistantCustomDataUrl: sanitizeImageDataUrl(candidate.assistantCustomDataUrl),
    userCustomDataUrl: sanitizeImageDataUrl(candidate.userCustomDataUrl),
  };
}

export async function getAssistantAvatarPreset(): Promise<AssistantAvatarPreset> {
  const { platformSettings } = await getRepositories();
  const row = await platformSettings.findById(ASSISTANT_AVATAR_SETTINGS_ROW_ID);

  if (!row) {
    await platformSettings.save(
      ASSISTANT_AVATAR_SETTINGS_ROW_ID,
      JSON.stringify({ assistantAvatarPreset: 'default' })
    );
    return 'default';
  }

  try {
    const parsed = JSON.parse(row.config) as Record<string, unknown>;
    return sanitizeAssistantAvatarPreset(parsed.assistantAvatarPreset);
  } catch {
    return 'default';
  }
}

export async function saveAssistantAvatarPreset(
  preset: AssistantAvatarPreset
): Promise<AssistantAvatarPreset> {
  const sanitizedPreset = sanitizeAssistantAvatarPreset(preset);
  const { platformSettings } = await getRepositories();
  await platformSettings.save(
    ASSISTANT_AVATAR_SETTINGS_ROW_ID,
    JSON.stringify({ assistantAvatarPreset: sanitizedPreset })
  );
  return sanitizedPreset;
}

export async function getStoredUserAvatarSettings(
  username: string | null
): Promise<StoredUserAvatarSettings> {
  const { platformSettings } = await getRepositories();
  const row = await platformSettings.findById(resolveUserAvatarSettingsRowId(username));

  if (!row) {
    return {
      assistantCustomDataUrl: null,
      userCustomDataUrl: null,
    };
  }

  try {
    return sanitizeStoredUserAvatarSettings(JSON.parse(row.config));
  } catch {
    return {
      assistantCustomDataUrl: null,
      userCustomDataUrl: null,
    };
  }
}

export async function saveStoredUserAvatarSettings(
  username: string | null,
  settings: StoredUserAvatarSettings
): Promise<StoredUserAvatarSettings> {
  const sanitizedSettings = sanitizeStoredUserAvatarSettings(settings);
  const { platformSettings } = await getRepositories();
  await platformSettings.save(
    resolveUserAvatarSettingsRowId(username),
    JSON.stringify(sanitizedSettings)
  );
  return sanitizedSettings;
}

export async function resolveProfileAvatarSettings(
  username: string | null
): Promise<ProfileAvatarSettings> {
  const [assistantAvatarPreset, userAvatarSettings] = await Promise.all([
    getAssistantAvatarPreset(),
    getStoredUserAvatarSettings(username),
  ]);

  const presetImageUrl = resolveAssistantAvatarPresetImageUrl(assistantAvatarPreset);
  const assistantImageUrl = userAvatarSettings.assistantCustomDataUrl ?? presetImageUrl;

  return {
    globalAssistantPreset: assistantAvatarPreset,
    assistant: {
      mode: userAvatarSettings.assistantCustomDataUrl
        ? 'custom'
        : presetImageUrl
          ? 'preset'
          : 'default',
      imageUrl: assistantImageUrl,
    },
    user: {
      mode: userAvatarSettings.userCustomDataUrl ? 'custom' : 'default',
      imageUrl: userAvatarSettings.userCustomDataUrl,
    },
  };
}
