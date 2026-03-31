import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';
import { getUsernameFromRequest, isClerkAuthEnabled } from '@/lib/auth';
import {
  getStoredUserAvatarSettings,
  resolveProfileAvatarSettings,
  saveStoredUserAvatarSettings,
} from '@/lib/profile/avatar-settings';
import { getUsageSummaryForUser } from '@/lib/profile/usage';
import { getProfileUiSettings } from '@/lib/profile/ui-settings';
import { getSecurityHeaders } from '@/lib/security';
import { ensureCurrentClerkUserAccess } from '@/lib/access/clerk-user';

vi.mock('@/lib/auth', () => ({
  getUsernameFromRequest: vi.fn(),
  isClerkAuthEnabled: vi.fn(),
}));

vi.mock('@/lib/access/clerk-user', () => ({
  ensureCurrentClerkUserAccess: vi.fn(),
}));

vi.mock('@/lib/profile/avatar-settings', () => ({
  getStoredUserAvatarSettings: vi.fn(),
  resolveProfileAvatarSettings: vi.fn(),
  saveStoredUserAvatarSettings: vi.fn(),
}));

vi.mock('@/lib/profile/usage', () => ({
  getUsageSummaryForUser: vi.fn(),
}));

vi.mock('@/lib/profile/ui-settings', () => ({
  getProfileUiSettings: vi.fn(),
}));

vi.mock('@/lib/security', () => ({
  getSecurityHeaders: vi.fn(() => ({ 'X-Test-Header': 'ok' })),
}));

describe('Profile API route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
    vi.mocked(isClerkAuthEnabled).mockReturnValue(false);
    vi.mocked(getProfileUiSettings).mockResolvedValue({
      showUsageSummary: true,
      showDailyUsageChart: true,
      showRecentTokenEvents: true,
    });
    vi.mocked(resolveProfileAvatarSettings).mockResolvedValue({
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
    vi.mocked(getStoredUserAvatarSettings).mockResolvedValue({
      assistantCustomDataUrl: null,
      userCustomDataUrl: null,
    });
    vi.mocked(ensureCurrentClerkUserAccess).mockResolvedValue(null);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns profile payload with usage only', async () => {
    vi.mocked(getUsernameFromRequest).mockReturnValueOnce('jose');
    vi.mocked(getUsageSummaryForUser).mockResolvedValueOnce({
      username: 'jose',
      totalRequests: 2,
      totalQuotes: 1,
      totalInputTokens: 10,
      totalOutputTokens: 20,
      totalTokens: 30,
      last30DaysTokens: 30,
      last30DaysRequests: 2,
      dailyUsage: [],
      recentEvents: [],
    });

    const response = await GET(new Request('http://localhost/api/profile'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('X-Test-Header')).toBe('ok');
    expect(body.profile.username).toBe('jose');
    expect(body.usage.totalTokens).toBe(30);
    expect(body.uiSettings).toEqual({
      showUsageSummary: true,
      showDailyUsageChart: true,
      showRecentTokenEvents: true,
    });
    expect(body.avatarSettings).toEqual({
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
    expect(body.limits).toBeUndefined();
    expect(body.plans).toBeUndefined();
  });

  it('returns 500 when usage retrieval fails', async () => {
    vi.mocked(getUsernameFromRequest).mockReturnValueOnce('anonymous');
    vi.mocked(getUsageSummaryForUser).mockRejectedValueOnce(new Error('db failed'));

    const response = await GET(new Request('http://localhost/api/profile'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(response.headers.get('X-Test-Header')).toBe('ok');
    expect(body).toEqual({ error: 'No se pudo cargar el perfil' });
    expect(getSecurityHeaders).toHaveBeenCalled();
  });

  it('returns 401 when Clerk auth is enabled and user is anonymous', async () => {
    vi.mocked(isClerkAuthEnabled).mockReturnValueOnce(true);
    vi.mocked(ensureCurrentClerkUserAccess).mockResolvedValueOnce(null);

    const response = await GET(new Request('http://localhost/api/profile'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(response.headers.get('X-Test-Header')).toBe('ok');
    expect(body).toEqual({ error: 'Authentication required' });
    expect(getUsageSummaryForUser).not.toHaveBeenCalled();
  });

  it('uses Clerk user identity when Clerk auth is enabled', async () => {
    vi.mocked(isClerkAuthEnabled).mockReturnValueOnce(true);
    vi.mocked(ensureCurrentClerkUserAccess).mockResolvedValueOnce({
      userId: 'user_123',
      username: 'jose@example.com',
      displayName: 'Jose Ramirez',
      publicMetadata: { role: 'viewer' },
    });
    vi.mocked(getUsageSummaryForUser).mockResolvedValueOnce({
      username: 'jose@example.com',
      totalRequests: 1,
      totalQuotes: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      last30DaysTokens: 0,
      last30DaysRequests: 1,
      dailyUsage: [],
      recentEvents: [],
    });

    const response = await GET(new Request('http://localhost/api/profile'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getUsageSummaryForUser).toHaveBeenCalledWith('jose@example.com');
    expect(body.profile.displayName).toBe('Jose Ramirez');
  });

  it('returns 401 when Clerk auth resolution fails', async () => {
    vi.mocked(isClerkAuthEnabled).mockReturnValueOnce(true);
    vi.mocked(ensureCurrentClerkUserAccess).mockRejectedValueOnce(new Error('clerk unavailable'));

    const response = await GET(new Request('http://localhost/api/profile'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'Authentication required' });
    expect(getUsageSummaryForUser).not.toHaveBeenCalled();
  });

  it('uses username claim and current user email fallback when full name is unavailable', async () => {
    vi.mocked(isClerkAuthEnabled).mockReturnValueOnce(true);
    vi.mocked(ensureCurrentClerkUserAccess).mockResolvedValueOnce({
      userId: 'user_456',
      username: 'claim-user',
      displayName: 'fallback@example.com',
      publicMetadata: { role: 'viewer' },
    });
    vi.mocked(getUsageSummaryForUser).mockResolvedValueOnce({
      username: 'claim-user',
      totalRequests: 0,
      totalQuotes: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      last30DaysTokens: 0,
      last30DaysRequests: 0,
      dailyUsage: [],
      recentEvents: [],
    });

    const response = await GET(new Request('http://localhost/api/profile'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getUsageSummaryForUser).toHaveBeenCalledWith('claim-user');
    expect(body.profile.displayName).toBe('fallback@example.com');
  });

  it('falls back to userId when claims and emails are missing', async () => {
    vi.mocked(isClerkAuthEnabled).mockReturnValueOnce(true);
    vi.mocked(ensureCurrentClerkUserAccess).mockResolvedValueOnce({
      userId: 'user_789',
      username: 'user_789',
      displayName: 'user_789',
      publicMetadata: { role: 'viewer' },
    });
    vi.mocked(getUsageSummaryForUser).mockResolvedValueOnce({
      username: 'user_789',
      totalRequests: 0,
      totalQuotes: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      last30DaysTokens: 0,
      last30DaysRequests: 0,
      dailyUsage: [],
      recentEvents: [],
    });

    const response = await GET(new Request('http://localhost/api/profile'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.profile.displayName).toBe('user_789');
  });

  it('provisions viewer role for a Clerk user without assigned access', async () => {
    vi.mocked(isClerkAuthEnabled).mockReturnValueOnce(true);
    vi.mocked(ensureCurrentClerkUserAccess).mockResolvedValueOnce({
      userId: 'user_no_role',
      username: 'norole@example.com',
      displayName: 'No Role Yet',
      publicMetadata: { role: 'viewer' },
    });
    vi.mocked(getUsageSummaryForUser).mockResolvedValueOnce({
      username: 'norole@example.com',
      totalRequests: 1,
      totalQuotes: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      last30DaysTokens: 0,
      last30DaysRequests: 1,
      dailyUsage: [],
      recentEvents: [],
    });

    const response = await GET(new Request('http://localhost/api/profile'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.profile.username).toBe('norole@example.com');
    expect(getUsageSummaryForUser).toHaveBeenCalledWith('norole@example.com');
  });

  it('allows a Clerk user without metadata when a local dev role override is set', async () => {
    process.env.DEV_AUTH_ROLE = 'viewer';
    vi.mocked(isClerkAuthEnabled).mockReturnValueOnce(true);
    vi.mocked(ensureCurrentClerkUserAccess).mockResolvedValueOnce({
      userId: 'user_local',
      username: 'local@example.com',
      displayName: 'Local Dev',
      publicMetadata: { role: 'viewer' },
    });
    vi.mocked(getUsageSummaryForUser).mockResolvedValueOnce({
      username: 'local@example.com',
      totalRequests: 1,
      totalQuotes: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      last30DaysTokens: 0,
      last30DaysRequests: 1,
      dailyUsage: [],
      recentEvents: [],
    });

    const response = await GET(new Request('http://localhost/api/profile'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.profile.displayName).toBe('Local Dev');
    expect(getUsageSummaryForUser).toHaveBeenCalledWith('local@example.com');
  });

  it('saves profile avatar overrides', async () => {
    vi.mocked(getUsernameFromRequest).mockReturnValueOnce('jose');
    vi.mocked(resolveProfileAvatarSettings).mockResolvedValueOnce({
      globalAssistantPreset: 'mascot',
      assistant: {
        mode: 'custom',
        imageUrl: 'data:image/webp;base64,abc123',
      },
      user: {
        mode: 'custom',
        imageUrl: 'data:image/webp;base64,user123',
      },
    });

    const response = await POST(
      new Request('http://localhost/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatarSettings: {
            assistantCustomDataUrl: 'data:image/webp;base64,abc123',
            userCustomDataUrl: 'data:image/webp;base64,user123',
          },
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(saveStoredUserAvatarSettings).toHaveBeenCalledWith('jose', {
      assistantCustomDataUrl: 'data:image/webp;base64,abc123',
      userCustomDataUrl: 'data:image/webp;base64,user123',
    });
    expect(body.avatarSettings.assistant.mode).toBe('custom');
    expect(body.avatarSettings.user.mode).toBe('custom');
  });
});
