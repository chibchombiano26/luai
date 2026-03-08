export const ASSISTANT_AVATAR_PRESET_VALUES = ['default', 'mascot', 'mascot_alt'] as const;

export type AssistantAvatarPreset = (typeof ASSISTANT_AVATAR_PRESET_VALUES)[number];

export const AI_MASCOT_AVATAR_PATH = '/avatar/Avatar.png';
export const AI_MASCOT_AVATAR_ALT_PATH = '/avatar/Avatar_2.png';

export function isAssistantAvatarPreset(value: unknown): value is AssistantAvatarPreset {
  return (
    typeof value === 'string' &&
    ASSISTANT_AVATAR_PRESET_VALUES.includes(value as AssistantAvatarPreset)
  );
}

export function resolveAssistantAvatarPresetImageUrl(
  preset: AssistantAvatarPreset
): string | null {
  if (preset === 'mascot') {
    return AI_MASCOT_AVATAR_PATH;
  }

  if (preset === 'mascot_alt') {
    return AI_MASCOT_AVATAR_ALT_PATH;
  }

  return null;
}
