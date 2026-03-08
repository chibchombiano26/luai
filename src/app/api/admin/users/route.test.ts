import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';
import { auth as clerkAuth, clerkClient as clerkServerClient } from '@clerk/nextjs/server';
import { isClerkAuthEnabled } from '@/lib/auth';
import { getSecurityHeaders } from '@/lib/security';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  isClerkAuthEnabled: vi.fn(),
}));

vi.mock('@/lib/security', () => ({
  getSecurityHeaders: vi.fn(() => ({ 'X-Test-Header': 'ok' })),
}));

const usersApi = {
  getUserList: vi.fn(),
  getUser: vi.fn(),
  updateUserMetadata: vi.fn(),
};

describe('Admin users API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(isClerkAuthEnabled).mockReturnValue(true);
    vi.mocked(clerkAuth).mockResolvedValue({ userId: 'user_admin' } as never);
    vi.mocked(clerkServerClient).mockResolvedValue({ users: usersApi } as never);
    usersApi.getUser.mockResolvedValue({
      id: 'user_admin',
      firstName: 'Admin',
      lastName: 'User',
      emailAddresses: [{ id: 'email_admin', emailAddress: 'admin@example.com' }],
      primaryEmailAddressId: 'email_admin',
      publicMetadata: { role: 'admin' },
      createdAt: 1,
      lastSignInAt: 1,
    });
  });

  it('returns 503 when Clerk auth is disabled', async () => {
    vi.mocked(isClerkAuthEnabled).mockReturnValueOnce(false);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(response.headers.get('X-Test-Header')).toBe('ok');
    expect(body).toEqual({ error: 'Clerk auth must be enabled to manage users' });
  });

  it('returns an empty user list in explicit noauth development mode', async () => {
    vi.mocked(isClerkAuthEnabled).mockReturnValueOnce(false);
    process.env.CLERK_AUTH_ENABLED = 'false';
    process.env.BASIC_AUTH_ENABLED = 'false';

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      users: [],
      roles: ['admin', 'operator', 'viewer'],
    });
  });

  it('returns 401 when no authenticated Clerk user exists', async () => {
    vi.mocked(clerkAuth).mockResolvedValueOnce({ userId: null } as never);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(response.headers.get('X-Test-Header')).toBe('ok');
    expect(body).toEqual({ error: 'Authentication required' });
  });

  it('returns 403 when actor is not admin', async () => {
    usersApi.getUser.mockResolvedValueOnce({
      id: 'user_viewer',
      firstName: 'Viewer',
      lastName: 'User',
      emailAddresses: [{ id: 'email_viewer', emailAddress: 'viewer@example.com' }],
      primaryEmailAddressId: 'email_viewer',
      publicMetadata: { role: 'viewer' },
      createdAt: 1,
      lastSignInAt: 1,
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'Admin privileges required' });
  });

  it('lists users with normalized role and email', async () => {
    usersApi.getUserList.mockResolvedValueOnce({
      data: [
        {
          id: 'user_1',
          firstName: 'Jose',
          lastName: 'Ramirez',
          emailAddresses: [{ id: 'email_1', emailAddress: 'jose@example.com' }],
          primaryEmailAddressId: 'email_1',
          publicMetadata: { role: 'admin' },
          createdAt: 100,
          lastSignInAt: 200,
        },
        {
          id: 'user_2',
          firstName: null,
          lastName: null,
          emailAddresses: [{ id: 'email_2', emailAddress: 'viewer@example.com' }],
          primaryEmailAddressId: 'email_2',
          publicMetadata: {},
          createdAt: 300,
          lastSignInAt: null,
        },
      ],
      totalCount: 2,
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.roles).toEqual(['admin', 'operator', 'viewer']);
    expect(body.users).toEqual([
      {
        id: 'user_1',
        fullName: 'Jose Ramirez',
        primaryEmail: 'jose@example.com',
        role: 'admin',
        createdAt: 100,
        lastSignInAt: 200,
      },
      {
        id: 'user_2',
        fullName: '',
        primaryEmail: 'viewer@example.com',
        role: null,
        createdAt: 300,
        lastSignInAt: null,
      },
    ]);
    expect(usersApi.getUserList).toHaveBeenCalledWith({
      limit: 100,
      orderBy: '-created_at',
    });
  });

  it('updates user role by writing to Clerk publicMetadata.role', async () => {
    usersApi.getUser
      .mockResolvedValueOnce({
        id: 'user_admin',
        firstName: 'Admin',
        lastName: 'User',
        emailAddresses: [{ id: 'email_admin', emailAddress: 'admin@example.com' }],
        primaryEmailAddressId: 'email_admin',
        publicMetadata: { role: 'admin' },
        createdAt: 1,
        lastSignInAt: 1,
      })
      .mockResolvedValueOnce({
        id: 'user_2',
        firstName: 'Ana',
        lastName: 'Gomez',
        emailAddresses: [{ id: 'email_2', emailAddress: 'ana@example.com' }],
        primaryEmailAddressId: 'email_2',
        publicMetadata: { theme: 'dark', role: 'viewer' },
        createdAt: 100,
        lastSignInAt: 120,
      });
    usersApi.updateUserMetadata.mockResolvedValueOnce({
      id: 'user_2',
      firstName: 'Ana',
      lastName: 'Gomez',
      emailAddresses: [{ id: 'email_2', emailAddress: 'ana@example.com' }],
      primaryEmailAddressId: 'email_2',
      publicMetadata: { theme: 'dark', role: 'operator' },
      createdAt: 100,
      lastSignInAt: 120,
    });

    const response = await POST(
      new Request('http://localhost/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user_2',
          role: 'operator',
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(usersApi.updateUserMetadata).toHaveBeenCalledWith('user_2', {
      publicMetadata: {
        theme: 'dark',
        role: 'operator',
      },
    });
    expect(body).toEqual({
      success: true,
      user: {
        id: 'user_2',
        fullName: 'Ana Gomez',
        primaryEmail: 'ana@example.com',
        role: 'operator',
        createdAt: 100,
        lastSignInAt: 120,
      },
    });
  });

  it('rejects role updates in explicit noauth development mode', async () => {
    vi.mocked(isClerkAuthEnabled).mockReturnValueOnce(false);
    process.env.CLERK_AUTH_ENABLED = 'false';
    process.env.BASIC_AUTH_ENABLED = 'false';

    const response = await POST(
      new Request('http://localhost/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user_2',
          role: 'operator',
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({ error: 'Clerk auth must be enabled to manage users' });
  });

  it('returns 400 when role payload is invalid', async () => {
    const response = await POST(
      new Request('http://localhost/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user_2',
          role: 'owner',
        }),
      })
    );

    expect(response.status).toBe(400);
    expect(getSecurityHeaders).toHaveBeenCalled();
  });
});
