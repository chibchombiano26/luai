import { beforeEach, describe, expect, it, vi } from 'vitest';

const repositoryState = vi.hoisted(() => ({
  platformSettings: {
    findById: vi.fn(),
    save: vi.fn(),
  },
}));

vi.mock('@/lib/repositories/repository-factory', () => ({
  getRepositories: vi.fn(async () => repositoryState),
}));

import {
  getAssistantAvatarPreset,
  getStoredUserAvatarSettings,
  resolveProfileAvatarSettings,
  sanitizeAssistantAvatarPreset,
  sanitizeStoredUserAvatarSettings,
  saveAssistantAvatarPreset,
  saveStoredUserAvatarSettings,
} from './avatar-settings';

describe('avatar-settings', () => {
  beforeEach(() => {
    repositoryState.platformSettings.findById.mockReset();
    repositoryState.platformSettings.save.mockReset();
  });

  it('sanitizes the assistant avatar preset', () => {
    expect(sanitizeAssistantAvatarPreset('mascot')).toBe('mascot');
    expect(sanitizeAssistantAvatarPreset('invalid')).toBe('default');
    expect(sanitizeAssistantAvatarPreset(null)).toBe('default');
  });

  it('sanitizes stored user avatar settings payloads', () => {
    expect(
      sanitizeStoredUserAvatarSettings({
        assistantCustomDataUrl: ' data:image/png;base64,AAAA ',
        userCustomDataUrl: 'not-a-data-url',
      })
    ).toEqual({
      assistantCustomDataUrl: 'data:image/png;base64,AAAA',
      userCustomDataUrl: null,
    });

    expect(sanitizeStoredUserAvatarSettings('invalid')).toEqual({
      assistantCustomDataUrl: null,
      userCustomDataUrl: null,
    });
  });

  it('creates the default assistant preset row when it does not exist', async () => {
    repositoryState.platformSettings.findById.mockResolvedValue(null);

    await expect(getAssistantAvatarPreset()).resolves.toBe('default');
    expect(repositoryState.platformSettings.save).toHaveBeenCalledWith(
      'assistant_avatar_settings',
      JSON.stringify({ assistantAvatarPreset: 'default' })
    );
  });

  it('returns a stored assistant preset when present', async () => {
    repositoryState.platformSettings.findById.mockResolvedValue({
      config: JSON.stringify({ assistantAvatarPreset: 'mascot_alt' }),
    });

    await expect(getAssistantAvatarPreset()).resolves.toBe('mascot_alt');
  });

  it('falls back to default preset when the stored assistant payload is invalid', async () => {
    repositoryState.platformSettings.findById.mockResolvedValue({
      config: '{invalid-json',
    });

    await expect(getAssistantAvatarPreset()).resolves.toBe('default');
  });

  it('saves a sanitized assistant avatar preset', async () => {
    await expect(saveAssistantAvatarPreset('mascot')).resolves.toBe('mascot');
    await expect(saveAssistantAvatarPreset('invalid' as never)).resolves.toBe('default');

    expect(repositoryState.platformSettings.save).toHaveBeenNthCalledWith(
      1,
      'assistant_avatar_settings',
      JSON.stringify({ assistantAvatarPreset: 'mascot' })
    );
    expect(repositoryState.platformSettings.save).toHaveBeenNthCalledWith(
      2,
      'assistant_avatar_settings',
      JSON.stringify({ assistantAvatarPreset: 'default' })
    );
  });

  it('returns empty stored user avatar settings when no row exists or json is invalid', async () => {
    repositoryState.platformSettings.findById
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ config: '{invalid-json' });

    await expect(getStoredUserAvatarSettings('jose')).resolves.toEqual({
      assistantCustomDataUrl: null,
      userCustomDataUrl: null,
    });
    await expect(getStoredUserAvatarSettings('jose')).resolves.toEqual({
      assistantCustomDataUrl: null,
      userCustomDataUrl: null,
    });
  });

  it('saves sanitized stored user avatar settings under the normalized username row id', async () => {
    await expect(
      saveStoredUserAvatarSettings(' jose@example.com ', {
        assistantCustomDataUrl: 'data:image/png;base64,AAAA',
        userCustomDataUrl: 'invalid',
      })
    ).resolves.toEqual({
      assistantCustomDataUrl: 'data:image/png;base64,AAAA',
      userCustomDataUrl: null,
    });

    expect(repositoryState.platformSettings.save).toHaveBeenCalledWith(
      'profile_avatar_settings:jose%40example.com',
      JSON.stringify({
        assistantCustomDataUrl: 'data:image/png;base64,AAAA',
        userCustomDataUrl: null,
      })
    );
  });

  it('uses anonymous as the fallback username row id', async () => {
    await saveStoredUserAvatarSettings(null, {
      assistantCustomDataUrl: null,
      userCustomDataUrl: null,
    });

    expect(repositoryState.platformSettings.save).toHaveBeenCalledWith(
      'profile_avatar_settings:anonymous',
      JSON.stringify({
        assistantCustomDataUrl: null,
        userCustomDataUrl: null,
      })
    );
  });

  it('resolves profile avatar settings for custom, preset, and default modes', async () => {
    repositoryState.platformSettings.findById
      .mockResolvedValueOnce({
        config: JSON.stringify({ assistantAvatarPreset: 'mascot' }),
      })
      .mockResolvedValueOnce({
        config: JSON.stringify({
          assistantCustomDataUrl: 'data:image/png;base64,AAAA',
          userCustomDataUrl: 'data:image/png;base64,BBBB',
        }),
      })
      .mockResolvedValueOnce({
        config: JSON.stringify({ assistantAvatarPreset: 'mascot_alt' }),
      })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        config: JSON.stringify({ assistantAvatarPreset: 'default' }),
      })
      .mockResolvedValueOnce(null);

    await expect(resolveProfileAvatarSettings('jose')).resolves.toEqual({
      globalAssistantPreset: 'mascot',
      assistant: {
        mode: 'custom',
        imageUrl: 'data:image/png;base64,AAAA',
      },
      user: {
        mode: 'custom',
        imageUrl: 'data:image/png;base64,BBBB',
      },
    });

    await expect(resolveProfileAvatarSettings('maria')).resolves.toEqual({
      globalAssistantPreset: 'mascot_alt',
      assistant: {
        mode: 'preset',
        imageUrl: '/avatar/Avatar_2.png',
      },
      user: {
        mode: 'default',
        imageUrl: null,
      },
    });

    await expect(resolveProfileAvatarSettings('anon')).resolves.toEqual({
      globalAssistantPreset: 'default',
      assistant: {
        mode: 'default',
        imageUrl: null,
      },
      user: {
        mode: 'default',
        imageUrl: null,
      },
    });
  });
});
