import { describe, expect, it } from 'vitest';
import {
  AI_MASCOT_AVATAR_ALT_PATH,
  AI_MASCOT_AVATAR_PATH,
  isAssistantAvatarPreset,
  resolveAssistantAvatarPresetImageUrl,
} from './avatar-config';

describe('avatar-config', () => {
  it('recognizes valid assistant avatar presets', () => {
    expect(isAssistantAvatarPreset('default')).toBe(true);
    expect(isAssistantAvatarPreset('mascot')).toBe(true);
    expect(isAssistantAvatarPreset('mascot_alt')).toBe(true);
  });

  it('rejects invalid assistant avatar presets', () => {
    expect(isAssistantAvatarPreset('')).toBe(false);
    expect(isAssistantAvatarPreset('unknown')).toBe(false);
    expect(isAssistantAvatarPreset(null)).toBe(false);
    expect(isAssistantAvatarPreset(undefined)).toBe(false);
  });

  it('resolves the expected image URL for each preset', () => {
    expect(resolveAssistantAvatarPresetImageUrl('default')).toBeNull();
    expect(resolveAssistantAvatarPresetImageUrl('mascot')).toBe(AI_MASCOT_AVATAR_PATH);
    expect(resolveAssistantAvatarPresetImageUrl('mascot_alt')).toBe(AI_MASCOT_AVATAR_ALT_PATH);
  });
});
