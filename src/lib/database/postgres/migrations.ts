import type { PostgresClient } from '@/lib/database/postgres/client';
import { POSTGRES_SCHEMA } from '@/lib/database/postgres/schema';

export interface PostgresMigration {
  version: string;
  sql?: string;
  run?: (client: PostgresClient) => Promise<void>;
}

export const POSTGRES_MIGRATIONS: PostgresMigration[] = [
  {
    version: '001_initial_schema',
    sql: POSTGRES_SCHEMA,
  },
  {
    version: '002_platform_settings_split',
    sql: `
      CREATE TABLE IF NOT EXISTS payload_config (
        id TEXT PRIMARY KEY,
        config TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS platform_settings (
        id TEXT PRIMARY KEY,
        config TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO platform_settings (id, config, updated_at)
      SELECT id, config, COALESCE(updated_at, CURRENT_TIMESTAMP)
      FROM payload_config
      WHERE id = 'flow_card_settings'
      ON CONFLICT (id) DO NOTHING;
    `,
  },
  {
    version: '003_drop_legacy_payload_config',
    run: async (client) => {
      await client.query(`
        CREATE TABLE IF NOT EXISTS payload_config (
          id TEXT PRIMARY KEY,
          config TEXT NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS platform_settings (
          id TEXT PRIMARY KEY,
          config TEXT NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await client.query(
        `INSERT INTO platform_settings (id, config, updated_at)
         SELECT id, config, COALESCE(updated_at, CURRENT_TIMESTAMP)
         FROM payload_config
         WHERE id = 'flow_card_settings'
         ON CONFLICT (id) DO NOTHING`
      );

      await client.query(`DELETE FROM payload_config WHERE id = 'flow_card_settings'`);
      const row = await client.query<{ total_rows?: unknown }>(
        'SELECT COUNT(*)::int AS total_rows FROM payload_config'
      );
      if (Number(row.rows[0]?.total_rows ?? 0) === 0) {
        await client.query('DROP TABLE IF EXISTS payload_config');
      }
    },
  },
];
