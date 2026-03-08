import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from './route';
import { auth as clerkAuth, clerkClient as clerkServerClient } from '@clerk/nextjs/server';
import { isClerkAuthEnabled } from '@/lib/auth';
import { getSecurityHeaders } from '@/lib/security';
import {
  getDatabaseProviderStatus,
  revealDatabaseProviderSecret,
  saveDatabaseProviderConfig,
} from '@/lib/database-provider-config';
import { resetDbInstance } from '@/lib/db';
import { resetPostgresClient } from '@/lib/database/postgres/client';
import { resetRepositoryFactory } from '@/lib/repositories/repository-factory';

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

vi.mock('@/lib/database-provider-config', () => ({
  getDatabaseProviderStatus: vi.fn(),
  revealDatabaseProviderSecret: vi.fn(),
  saveDatabaseProviderConfig: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  resetDbInstance: vi.fn(),
}));

vi.mock('@/lib/database/postgres/client', () => ({
  resetPostgresClient: vi.fn(),
}));

vi.mock('@/lib/repositories/repository-factory', () => ({
  resetRepositoryFactory: vi.fn(),
}));

const usersApi = {
  getUser: vi.fn(),
};

describe('Admin database provider API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(isClerkAuthEnabled).mockReturnValue(true);
    vi.mocked(clerkAuth).mockResolvedValue({ userId: 'user_admin' } as never);
    vi.mocked(clerkServerClient).mockResolvedValue({ users: usersApi } as never);
    usersApi.getUser.mockResolvedValue({
      id: 'user_admin',
      publicMetadata: { role: 'admin' },
    });
    vi.mocked(getDatabaseProviderStatus).mockResolvedValue({
      selectedProvider: 'sqlite',
      source: 'default',
      sqlite: { path: '/tmp/quotes.db' },
      turso: { url: '', hasAuthToken: false, credentialsSource: null },
      postgres: { connectionString: '', hasConnectionString: false, credentialsSource: null },
    });
    vi.mocked(revealDatabaseProviderSecret).mockResolvedValue({
      authToken: 'visible-token',
      source: 'admin',
    });
    vi.mocked(saveDatabaseProviderConfig).mockResolvedValue({
      selectedProvider: 'turso',
      source: 'admin',
      sqlite: { path: '/tmp/quotes.db' },
      turso: {
        url: 'libsql://example.turso.io',
        hasAuthToken: true,
        credentialsSource: 'admin',
      },
      postgres: { connectionString: '', hasConnectionString: false, credentialsSource: null },
    });
  });

  it('returns summary status', async () => {
    const response = await GET(new Request('http://localhost/api/admin/database-provider'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status.selectedProvider).toBe('sqlite');
  });

  it('reveals token only when explicitly requested', async () => {
    const response = await GET(
      new Request('http://localhost/api/admin/database-provider?includeSecret=1&provider=turso')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      provider: 'turso',
      authToken: 'visible-token',
      source: 'admin',
    });
    expect(revealDatabaseProviderSecret).toHaveBeenCalledWith('turso');
  });

  it('reveals postgres connection string only when explicitly requested', async () => {
    vi.mocked(revealDatabaseProviderSecret).mockResolvedValueOnce({
      connectionString: 'postgres://user:secret@host:5432/app',
      source: 'admin',
    });

    const response = await GET(
      new Request('http://localhost/api/admin/database-provider?includeSecret=1&provider=postgres')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      provider: 'postgres',
      connectionString: 'postgres://user:secret@host:5432/app',
      source: 'admin',
    });
    expect(revealDatabaseProviderSecret).toHaveBeenCalledWith('postgres');
  });

  it('saves sqlite selection and resets active db instance', async () => {
    vi.mocked(saveDatabaseProviderConfig).mockResolvedValueOnce({
      selectedProvider: 'sqlite',
      source: 'admin',
      sqlite: { path: '/tmp/quotes.db' },
      turso: {
        url: 'libsql://example.turso.io',
        hasAuthToken: true,
        credentialsSource: 'admin',
      },
      postgres: { connectionString: '', hasConnectionString: false, credentialsSource: null },
    });

    const response = await POST(
      new Request('http://localhost/api/admin/database-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedProvider: 'sqlite',
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(saveDatabaseProviderConfig).toHaveBeenCalledWith({ selectedProvider: 'sqlite' });
    expect(resetDbInstance).toHaveBeenCalled();
    expect(resetPostgresClient).toHaveBeenCalled();
    expect(resetRepositoryFactory).toHaveBeenCalled();
    expect(body.status.selectedProvider).toBe('sqlite');
  });

  it('saves turso selection with url and token', async () => {
    const response = await POST(
      new Request('http://localhost/api/admin/database-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedProvider: 'turso',
          tursoUrl: 'libsql://example.turso.io',
          tursoAuthToken: 'secret-token',
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(saveDatabaseProviderConfig).toHaveBeenCalledWith({
      selectedProvider: 'turso',
      tursoUrl: 'libsql://example.turso.io',
      tursoAuthToken: 'secret-token',
    });
    expect(body.status.selectedProvider).toBe('turso');
  });

  it('saves postgres selection with connection string', async () => {
    vi.mocked(saveDatabaseProviderConfig).mockResolvedValueOnce({
      selectedProvider: 'postgres',
      source: 'admin',
      sqlite: { path: '/tmp/quotes.db' },
      turso: {
        url: 'libsql://example.turso.io',
        hasAuthToken: true,
        credentialsSource: 'admin',
      },
      postgres: {
        connectionString: 'postgres://user:secret@host:5432/app',
        hasConnectionString: true,
        credentialsSource: 'admin',
      },
    });

    const response = await POST(
      new Request('http://localhost/api/admin/database-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedProvider: 'postgres',
          postgresConnectionString: 'postgres://user:secret@host:5432/app',
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(saveDatabaseProviderConfig).toHaveBeenCalledWith({
      selectedProvider: 'postgres',
      postgresConnectionString: 'postgres://user:secret@host:5432/app',
    });
    expect(body.status.selectedProvider).toBe('postgres');
  });

  it('returns 400 for invalid payload', async () => {
    const response = await POST(
      new Request('http://localhost/api/admin/database-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedProvider: 'turso',
          tursoUrl: '',
        }),
      })
    );

    expect(response.status).toBe(400);
    expect(getSecurityHeaders).toHaveBeenCalled();
  });

  it('allows loading database provider status in explicit noauth development mode', async () => {
    vi.mocked(isClerkAuthEnabled).mockReturnValueOnce(false);
    process.env.CLERK_AUTH_ENABLED = 'false';
    process.env.BASIC_AUTH_ENABLED = 'false';

    const response = await GET(new Request('http://localhost/api/admin/database-provider'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status.selectedProvider).toBe('sqlite');
  });

  it('allows saving database provider config in explicit noauth development mode', async () => {
    vi.mocked(isClerkAuthEnabled).mockReturnValueOnce(false);
    process.env.CLERK_AUTH_ENABLED = 'false';
    process.env.BASIC_AUTH_ENABLED = 'false';

    const response = await POST(
      new Request('http://localhost/api/admin/database-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedProvider: 'sqlite',
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(saveDatabaseProviderConfig).toHaveBeenCalledWith({ selectedProvider: 'sqlite' });
  });
});
