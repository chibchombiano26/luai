import type { DbInterface } from '@/lib/db';
import { SQL_MIGRATIONS } from '@/lib/database/sql/migrations';

export async function ensureSqlDatabaseReady(db: DbInterface): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const rows = (await db.all('SELECT version FROM schema_migrations ORDER BY version')) as Array<{
    version?: unknown;
  }>;
  const appliedVersions = new Set(
    rows.flatMap((row) => (typeof row.version === 'string' ? [row.version] : []))
  );

  for (const migration of SQL_MIGRATIONS) {
    if (appliedVersions.has(migration.version)) {
      continue;
    }

    if (migration.run) {
      await migration.run(db);
    } else if (migration.sql) {
      await db.exec(migration.sql);
    } else {
      throw new Error(`SQL migration ${migration.version} is missing sql and run`);
    }
    await db.run('INSERT OR IGNORE INTO schema_migrations (version) VALUES (?)', [migration.version]);
  }
}
