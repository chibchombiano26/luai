import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('pg', () => {
  const query = vi.fn();
  const end = vi.fn().mockResolvedValue(undefined);
  const Pool = vi.fn(function MockPool() {
    return { query, end };
  });
  return { Pool, __poolQuery: query, __poolEnd: end };
});

vi.mock('@/lib/database-provider-config', () => ({
  resolveActiveDatabaseConnectionConfig: vi.fn(),
}));

vi.mock('@/lib/database/postgres/bootstrap', () => ({
  ensurePostgresDatabaseReady: vi.fn(),
}));

describe('getPostgresClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('waits for a single shared initialization when postgres is requested concurrently', async () => {
    const { resolveActiveDatabaseConnectionConfig } = await import('@/lib/database-provider-config');
    const { ensurePostgresDatabaseReady } = await import('@/lib/database/postgres/bootstrap');
    const { getPostgresClient, resetPostgresClient } = await import('./client');
    const { Pool } = await import('pg');

    vi.mocked(resolveActiveDatabaseConnectionConfig).mockResolvedValue({
      provider: 'postgres',
      source: 'env',
      postgresConnectionString: 'postgres://user:pass@localhost:5432/app',
      cacheKey: 'postgres:postgres://user:pass@localhost:5432/app',
    });

    let releaseInitialization: (() => void) | null = null;
    const initializationBarrier = new Promise<void>((resolve) => {
      releaseInitialization = resolve;
    });
    vi.mocked(ensurePostgresDatabaseReady).mockImplementation(async () => {
      await initializationBarrier;
    });

    const firstCall = getPostgresClient();
    const secondCall = getPostgresClient();

    await vi.waitFor(() => {
      expect(Pool).toHaveBeenCalledTimes(1);
      expect(ensurePostgresDatabaseReady).toHaveBeenCalledTimes(1);
    });

    releaseInitialization?.();

    const [firstClient, secondClient] = await Promise.all([firstCall, secondCall]);

    expect(firstClient).toBe(secondClient);

    await resetPostgresClient();
  });
});
