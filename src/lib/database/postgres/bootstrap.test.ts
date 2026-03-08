import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ensurePostgresDatabaseReady } from '@/lib/database/postgres/bootstrap';
import { POSTGRES_MIGRATIONS } from '@/lib/database/postgres/migrations';

describe('ensurePostgresDatabaseReady', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('applies pending migrations and records the applied version', async () => {
    const client = {
      query: vi.fn().mockImplementation(async (sql: string) => {
        if (sql === 'SELECT version FROM schema_migrations ORDER BY version') {
          return { rows: [] };
        }

        if (sql === 'SELECT COUNT(*)::int AS total_rows FROM payload_config') {
          return { rows: [{ total_rows: 0 }] };
        }

        return { rows: [] };
      }),
      end: vi.fn().mockResolvedValue(undefined),
    };

    await ensurePostgresDatabaseReady(client);

    expect(client.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('CREATE TABLE IF NOT EXISTS schema_migrations')
    );
    expect(client.query).toHaveBeenNthCalledWith(
      2,
      'SELECT version FROM schema_migrations ORDER BY version'
    );

    const migrationInsertCalls = client.query.mock.calls.filter(
      ([sql]) =>
        sql ===
        'INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING'
    );
    expect(migrationInsertCalls).toHaveLength(POSTGRES_MIGRATIONS.length);
    expect(migrationInsertCalls.map(([, params]) => params?.[0])).toEqual(
      POSTGRES_MIGRATIONS.map((migration) => migration.version)
    );
    expect(client.query).toHaveBeenCalledWith('DROP TABLE IF EXISTS payload_config');
  });

  it('skips already applied migrations', async () => {
    const client = {
      query: vi.fn().mockImplementation(async (sql: string) => {
        if (sql === 'SELECT version FROM schema_migrations ORDER BY version') {
          return {
            rows: POSTGRES_MIGRATIONS.map((migration) => ({ version: migration.version })),
          };
        }

        return { rows: [] };
      }),
      end: vi.fn().mockResolvedValue(undefined),
    };

    await ensurePostgresDatabaseReady(client);

    expect(client.query).toHaveBeenCalledTimes(2);
  });
});
