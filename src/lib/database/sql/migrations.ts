import type { DbInterface } from '@/lib/db';
import { SQL_SCHEMA } from '@/lib/database/sql/schema';

export interface SqlMigration {
  version: string;
  sql?: string;
  run?: (db: DbInterface) => Promise<void>;
}

export const SQL_MIGRATIONS: SqlMigration[] = [
  {
    version: '001_initial_schema',
    sql: SQL_SCHEMA,
  },
  {
    version: '002_platform_settings_split',
    sql: `
      CREATE TABLE IF NOT EXISTS payload_config (
        id TEXT PRIMARY KEY,
        config TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS platform_settings (
        id TEXT PRIMARY KEY,
        config TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO platform_settings (id, config, updated_at)
      SELECT id, config, COALESCE(updated_at, CURRENT_TIMESTAMP)
      FROM payload_config
      WHERE id = 'flow_card_settings'
        AND NOT EXISTS (
          SELECT 1 FROM platform_settings WHERE id = payload_config.id
        );
    `,
  },
  {
    version: '003_drop_legacy_payload_config',
    run: async (db) => {
      await db.exec(`
        CREATE TABLE IF NOT EXISTS payload_config (
          id TEXT PRIMARY KEY,
          config TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS platform_settings (
          id TEXT PRIMARY KEY,
          config TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await db.run(
        `INSERT INTO platform_settings (id, config, updated_at)
         SELECT id, config, COALESCE(updated_at, CURRENT_TIMESTAMP)
         FROM payload_config
         WHERE id = 'flow_card_settings'
           AND NOT EXISTS (
             SELECT 1 FROM platform_settings WHERE id = 'flow_card_settings'
           )`
      );

      await db.run(`DELETE FROM payload_config WHERE id = 'flow_card_settings'`);

      const row = (await db.get(
        'SELECT COUNT(*) AS totalRows FROM payload_config'
      )) as { totalRows?: unknown } | undefined;
      if (Number(row?.totalRows ?? 0) === 0) {
        await db.exec('DROP TABLE IF EXISTS payload_config');
      }
    },
  },
];
