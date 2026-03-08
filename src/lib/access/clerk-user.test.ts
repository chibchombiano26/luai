import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureCurrentClerkUserAccess } from './clerk-user';

const {
  getUserMock,
  getUserListMock,
  updateUserMetadataMock,
  authMock,
  clerkClientMock,
} = vi.hoisted(() => {
  const getUserMock = vi.fn();
  const getUserListMock = vi.fn();
  const updateUserMetadataMock = vi.fn();
  const authMock = vi.fn();
  const clerkClientMock = vi.fn(async () => ({
    users: {
      getUser: getUserMock,
      getUserList: getUserListMock,
      updateUserMetadata: updateUserMetadataMock,
    },
  }));

  return {
    getUserMock,
    getUserListMock,
    updateUserMetadataMock,
    authMock,
    clerkClientMock,
  };
});

vi.mock('@clerk/nextjs/server', () => ({
  auth: authMock,
  clerkClient: clerkClientMock,
}));

describe('ensureCurrentClerkUserAccess', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
    authMock.mockResolvedValue({ userId: 'user_123' });
    getUserMock.mockResolvedValue({
      id: 'user_123',
      createdAt: 100,
      firstName: 'Jose',
      lastName: 'Ramirez',
      fullName: 'Jose Ramirez',
      primaryEmailAddressId: 'email_1',
      emailAddresses: [{ id: 'email_1', emailAddress: 'jose@example.com' }],
      publicMetadata: { role: 'viewer' },
    });
    getUserListMock.mockResolvedValue({
      data: [{ id: 'user_123' }],
      totalCount: 1,
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns null when there is no authenticated Clerk user', async () => {
    authMock.mockResolvedValueOnce({ userId: null });

    await expect(ensureCurrentClerkUserAccess()).resolves.toBeNull();
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it('returns the existing Clerk user identity when access is already assigned', async () => {
    const result = await ensureCurrentClerkUserAccess();

    expect(result).toEqual({
      userId: 'user_123',
      username: 'jose@example.com',
      displayName: 'Jose Ramirez',
      publicMetadata: { role: 'viewer' },
    });
    expect(updateUserMetadataMock).not.toHaveBeenCalled();
  });

  it('assigns admin role to the first Clerk user in the instance', async () => {
    getUserMock.mockResolvedValueOnce({
      id: 'user_123',
      createdAt: 100,
      firstName: 'Jose',
      lastName: 'Ramirez',
      fullName: null,
      primaryEmailAddressId: 'email_1',
      emailAddresses: [{ id: 'email_1', emailAddress: 'jose@example.com' }],
      publicMetadata: { theme: 'dark' },
    });
    getUserListMock.mockResolvedValueOnce({
      data: [{ id: 'user_123' }],
      totalCount: 1,
    });
    updateUserMetadataMock.mockResolvedValueOnce({
      id: 'user_123',
      createdAt: 100,
      firstName: 'Jose',
      lastName: 'Ramirez',
      fullName: null,
      primaryEmailAddressId: 'email_1',
      emailAddresses: [{ id: 'email_1', emailAddress: 'jose@example.com' }],
      publicMetadata: { theme: 'dark', role: 'admin' },
    });

    const result = await ensureCurrentClerkUserAccess();

    expect(getUserListMock).toHaveBeenCalledWith({
      limit: 1,
      orderBy: '+created_at',
    });
    expect(updateUserMetadataMock).toHaveBeenCalledWith('user_123', {
      publicMetadata: { theme: 'dark', role: 'admin' },
    });
    expect(result).toEqual({
      userId: 'user_123',
      username: 'jose@example.com',
      displayName: 'Jose Ramirez',
      publicMetadata: { theme: 'dark', role: 'admin' },
    });
  });

  it('assigns viewer role to non-first Clerk users', async () => {
    getUserMock.mockResolvedValueOnce({
      id: 'user_456',
      createdAt: 200,
      firstName: 'Ana',
      lastName: 'Diaz',
      fullName: null,
      primaryEmailAddressId: 'email_2',
      emailAddresses: [{ id: 'email_2', emailAddress: 'ana@example.com' }],
      publicMetadata: {},
    });
    getUserListMock.mockResolvedValueOnce({
      data: [{ id: 'user_123' }],
      totalCount: 2,
    });
    updateUserMetadataMock.mockResolvedValueOnce({
      id: 'user_456',
      createdAt: 200,
      firstName: 'Ana',
      lastName: 'Diaz',
      fullName: null,
      primaryEmailAddressId: 'email_2',
      emailAddresses: [{ id: 'email_2', emailAddress: 'ana@example.com' }],
      publicMetadata: { role: 'viewer' },
    });

    const result = await ensureCurrentClerkUserAccess();

    expect(updateUserMetadataMock).toHaveBeenCalledWith('user_456', {
      publicMetadata: { role: 'viewer' },
    });
    expect(result).toEqual({
      userId: 'user_456',
      username: 'ana@example.com',
      displayName: 'Ana Diaz',
      publicMetadata: { role: 'viewer' },
    });
  });

  it('assigns viewer role when public metadata is not an object', async () => {
    getUserMock.mockResolvedValueOnce({
      id: 'user_456',
      createdAt: 200,
      firstName: null,
      lastName: null,
      fullName: null,
      primaryEmailAddressId: null,
      emailAddresses: [],
      publicMetadata: [],
    });
    getUserListMock.mockResolvedValueOnce({
      data: [{ id: 'user_123' }],
      totalCount: 2,
    });
    updateUserMetadataMock.mockResolvedValueOnce({
      id: 'user_456',
      createdAt: 200,
      firstName: null,
      lastName: null,
      fullName: null,
      primaryEmailAddressId: null,
      emailAddresses: [],
      publicMetadata: { role: 'viewer' },
    });

    const result = await ensureCurrentClerkUserAccess();

    expect(updateUserMetadataMock).toHaveBeenCalledWith('user_456', {
      publicMetadata: { role: 'viewer' },
    });
    expect(result).toEqual({
      userId: 'user_456',
      username: 'user_456',
      displayName: 'user_456',
      publicMetadata: { role: 'viewer' },
    });
  });

  it('does not overwrite users that already have group-based access', async () => {
    getUserMock.mockResolvedValueOnce({
      id: 'user_123',
      fullName: null,
      primaryEmailAddressId: null,
      emailAddresses: [],
      publicMetadata: { orgId: 'org_123' },
    });

    const result = await ensureCurrentClerkUserAccess();

    expect(updateUserMetadataMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      userId: 'user_123',
      username: 'user_123',
      displayName: 'user_123',
      publicMetadata: { orgId: 'org_123' },
    });
  });
});
