import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getRepositoryFactory, getRepositories, resetRepositoryFactory } from '@/lib/repositories/repository-factory';
import { getDb } from '@/lib/db';
import { getPostgresClient } from '@/lib/database/postgres/client';
import { resolveActiveDatabaseConnectionConfig } from '@/lib/database-provider-config';

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(),
}));

vi.mock('@/lib/database/postgres/client', () => ({
  getPostgresClient: vi.fn(),
}));

vi.mock('@/lib/database-provider-config', () => ({
  resolveActiveDatabaseConnectionConfig: vi.fn(),
}));

describe('repository factory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRepositoryFactory();
    vi.mocked(getDb).mockResolvedValue({
      get: vi.fn(),
      all: vi.fn(),
      run: vi.fn(),
      exec: vi.fn(),
    } as never);
    vi.mocked(getPostgresClient).mockResolvedValue({
      query: vi.fn(),
      end: vi.fn(),
    } as never);
  });

  it('uses the sql adapter for sqlite connections', async () => {
    vi.mocked(resolveActiveDatabaseConnectionConfig).mockResolvedValue({
      provider: 'sqlite',
      source: 'default',
      sqlitePath: '/tmp/quotes.db',
      cacheKey: 'sqlite:/tmp/quotes.db',
    });

    const factory = await getRepositoryFactory();

    expect(factory.adapter).toBe('sql');
    expect(factory.provider).toBe('sqlite');
    expect(factory.repositories.aiProviderSecrets).toBeDefined();
    expect(factory.repositories.platformSettings).toBeDefined();
  });

  it('uses the sql adapter for turso connections', async () => {
    vi.mocked(resolveActiveDatabaseConnectionConfig).mockResolvedValue({
      provider: 'turso',
      source: 'env',
      tursoUrl: 'libsql://test.turso.io',
      tursoAuthToken: 'secret',
      cacheKey: 'turso:libsql://test.turso.io:secret',
    });

    const factory = await getRepositoryFactory();

    expect(factory.adapter).toBe('sql');
    expect(factory.provider).toBe('turso');
    expect(factory.repositories.aiProviderSecrets).toBeDefined();
    expect(factory.repositories.usageEvents).toBeDefined();
  });

  it('uses the postgres adapter for postgres connections', async () => {
    vi.mocked(resolveActiveDatabaseConnectionConfig).mockResolvedValue({
      provider: 'postgres',
      source: 'env',
      postgresConnectionString: 'postgres://user:pass@localhost:5432/app',
      cacheKey: 'postgres:postgres://user:pass@localhost:5432/app',
    });

    const factory = await getRepositoryFactory();

    expect(factory.adapter).toBe('postgres');
    expect(factory.provider).toBe('postgres');
    expect(factory.repositories.platformSettings).toBeDefined();
    expect(factory.repositories.usageEvents).toBeDefined();
  });

  it('reuses the same factory for the same connection cache key', async () => {
    vi.mocked(resolveActiveDatabaseConnectionConfig).mockResolvedValue({
      provider: 'sqlite',
      source: 'default',
      sqlitePath: '/tmp/quotes.db',
      cacheKey: 'sqlite:/tmp/quotes.db',
    });

    const first = await getRepositoryFactory();
    const second = await getRepositories();

    expect(first.repositories).toBe(second);
  });
});
