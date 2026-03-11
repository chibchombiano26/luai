import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  getUsernameFromRequest: vi.fn(),
  isClerkAuthEnabled: vi.fn(),
}));

vi.mock('@/lib/access/clerk-user', () => ({
  ensureCurrentClerkUserAccess: vi.fn(),
}));

vi.mock('@/lib/access/roles', () => ({
  isAdminRole: vi.fn(),
  resolveAppUserRoleFromMetadata: vi.fn(),
}));

vi.mock('@/lib/security', () => ({
  getSecurityHeaders: () => ({
    'x-test-header': '1',
  }),
}));

import { auth, clerkClient } from '@clerk/nextjs/server';
import { getUsernameFromRequest, isClerkAuthEnabled } from '@/lib/auth';
import { ensureCurrentClerkUserAccess } from '@/lib/access/clerk-user';
import { isAdminRole, resolveAppUserRoleFromMetadata } from '@/lib/access/roles';
import {
  ensureMarketAdminAccess,
  resolveMarketUserContext,
  responseJson,
} from './access';

describe('market access helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('builds json responses with security headers', async () => {
    const response = responseJson({ ok: true }, 201);

    expect(response.status).toBe(201);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(response.headers.get('x-test-header')).toBe('1');
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it('uses the plain request username when clerk auth is disabled', async () => {
    vi.mocked(isClerkAuthEnabled).mockReturnValue(false);
    vi.mocked(getUsernameFromRequest).mockReturnValue('luisa');

    await expect(resolveMarketUserContext(new Request('http://localhost'))).resolves.toEqual({
      username: 'luisa',
      displayName: 'luisa',
    });
  });

  it('falls back to the request header identity when clerk lookup fails', async () => {
    vi.mocked(isClerkAuthEnabled).mockReturnValue(true);
    vi.mocked(getUsernameFromRequest).mockReturnValue('luisa');
    vi.mocked(ensureCurrentClerkUserAccess).mockRejectedValue(new Error('boom'));

    await expect(resolveMarketUserContext(new Request('http://localhost'))).resolves.toEqual({
      username: 'luisa',
      displayName: 'luisa',
    });
  });

  it('requires authentication when clerk auth is enabled and no identity exists', async () => {
    vi.mocked(isClerkAuthEnabled).mockReturnValue(true);
    vi.mocked(getUsernameFromRequest).mockReturnValue('anonymous');
    vi.mocked(ensureCurrentClerkUserAccess).mockResolvedValue(null);

    const response = await resolveMarketUserContext(new Request('http://localhost'));

    expect(response).toBeInstanceOf(Response);
    expect((response as Response).status).toBe(401);
  });

  it('allows admin access through clerk roles', async () => {
    vi.mocked(isClerkAuthEnabled).mockReturnValue(true);
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(clerkClient).mockResolvedValue({
      users: {
        getUser: vi.fn().mockResolvedValue({
          publicMetadata: { role: 'admin' },
        }),
      },
    } as never);
    vi.mocked(resolveAppUserRoleFromMetadata).mockReturnValue('admin');
    vi.mocked(isAdminRole).mockReturnValue(true);

    await expect(ensureMarketAdminAccess(new Request('http://localhost'))).resolves.toBeNull();
  });

  it('returns 403 for non-admin clerk users and 401 when clerk auth throws', async () => {
    vi.mocked(isClerkAuthEnabled).mockReturnValue(true);
    vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as never);
    vi.mocked(clerkClient).mockResolvedValue({
      users: {
        getUser: vi.fn().mockResolvedValue({
          publicMetadata: { role: 'member' },
        }),
      },
    } as never);
    vi.mocked(resolveAppUserRoleFromMetadata).mockReturnValue('member');
    vi.mocked(isAdminRole).mockReturnValue(false);

    let response = await ensureMarketAdminAccess(new Request('http://localhost'));
    expect(response?.status).toBe(403);

    vi.mocked(auth).mockRejectedValue(new Error('boom'));
    response = await ensureMarketAdminAccess(new Request('http://localhost'));
    expect(response?.status).toBe(401);
  });

  it('supports basic auth and no-auth development fallbacks', async () => {
    vi.mocked(isClerkAuthEnabled).mockReturnValue(false);

    vi.stubEnv('BASIC_AUTH_USERNAME', 'luisa');
    vi.stubEnv('BASIC_AUTH_PASSWORD', 'secret');
    const basicAuth = Buffer.from('luisa:secret').toString('base64');

    await expect(
      ensureMarketAdminAccess(
        new Request('http://localhost', {
          headers: {
            authorization: `Basic ${basicAuth}`,
          },
        })
      )
    ).resolves.toBeNull();

    vi.stubEnv('BASIC_AUTH_ENABLED', 'false');
    vi.stubEnv('CLERK_AUTH_ENABLED', 'false');
    vi.stubEnv('NODE_ENV', 'development');

    await expect(ensureMarketAdminAccess(new Request('http://localhost'))).resolves.toBeNull();
  });

  it('returns auth failures for invalid basic auth and missing production auth config', async () => {
    vi.mocked(isClerkAuthEnabled).mockReturnValue(false);

    vi.stubEnv('BASIC_AUTH_USERNAME', 'luisa');
    vi.stubEnv('BASIC_AUTH_PASSWORD', 'secret');

    let response = await ensureMarketAdminAccess(
      new Request('http://localhost', {
        headers: {
          authorization: `Basic ${Buffer.from('luisa:wrong').toString('base64')}`,
        },
      })
    );
    expect(response?.status).toBe(401);

    vi.stubEnv('BASIC_AUTH_ENABLED', 'false');
    vi.stubEnv('CLERK_AUTH_ENABLED', 'false');
    vi.stubEnv('NODE_ENV', 'production');

    response = await ensureMarketAdminAccess(new Request('http://localhost'));
    expect(response?.status).toBe(503);
  });

  it('rejects malformed basic auth payloads and missing usernames in clerk fallback mode', async () => {
    vi.mocked(isClerkAuthEnabled).mockReturnValue(false);
    vi.stubEnv('BASIC_AUTH_USERNAME', 'luisa');
    vi.stubEnv('BASIC_AUTH_PASSWORD', 'secret');

    let response = await ensureMarketAdminAccess(
      new Request('http://localhost', {
        headers: {
          authorization: 'Basic not-base64',
        },
      })
    );
    expect(response?.status).toBe(401);

    vi.mocked(isClerkAuthEnabled).mockReturnValue(true);
    vi.mocked(getUsernameFromRequest).mockReturnValue(' ');
    vi.mocked(ensureCurrentClerkUserAccess).mockResolvedValue(null);

    response = await resolveMarketUserContext(new Request('http://localhost'));
    expect((response as Response).status).toBe(401);
  });
});
