import type { PostgresClient } from '@/lib/database/postgres/client';
import { POSTGRES_MIGRATIONS } from '@/lib/database/postgres/migrations';

export async function ensurePostgresDatabaseReady(client: PostgresClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const rows = await client.query<{ version?: unknown }>(
    'SELECT version FROM schema_migrations ORDER BY version'
  );
  const appliedVersions = new Set(
    rows.rows.flatMap((row) => (typeof row.version === 'string' ? [row.version] : []))
  );

  for (const migration of POSTGRES_MIGRATIONS) {
    if (appliedVersions.has(migration.version)) {
      continue;
    }

    if (migration.run) {
      await migration.run(client);
    } else if (migration.sql) {
      await client.query(migration.sql);
    } else {
      throw new Error(`Postgres migration ${migration.version} is missing sql and run`);
    }
    await client.query('INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING', [
      migration.version,
    ]);
  }
}
