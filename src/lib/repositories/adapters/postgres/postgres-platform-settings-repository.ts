import type { PostgresClient } from '@/lib/database/postgres/client';
import type {
  PlatformSettingsRecord,
  PlatformSettingsRepository,
} from '@/lib/repositories/platform-settings-repository';

export type ClientResolver = () => Promise<PostgresClient>;

interface PlatformSettingsRow {
  id?: unknown;
  config?: unknown;
  updated_at?: unknown;
}

function normalizeRow(id: string, row: PlatformSettingsRow | undefined): PlatformSettingsRecord | null {
  if (!row) return null;
  return {
    id: typeof row.id === 'string' ? row.id : id,
    config: typeof row.config === 'string' ? row.config : '',
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
  };
}

export function createPostgresPlatformSettingsRepository(options: {
  getClient: ClientResolver;
}): PlatformSettingsRepository {
  const { getClient } = options;

  return {
    async findById(id: string): Promise<PlatformSettingsRecord | null> {
      const client = await getClient();
      const result = await client.query<PlatformSettingsRow>(
        `SELECT id, config, updated_at
         FROM platform_settings
         WHERE id = $1`,
        [id]
      );
      return normalizeRow(id, result.rows[0]);
    },

    async save(id: string, config: string): Promise<void> {
      const client = await getClient();
      await client.query(
        `INSERT INTO platform_settings (id, config, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
           config = EXCLUDED.config,
           updated_at = CURRENT_TIMESTAMP`,
        [id, config]
      );
    },
  };
}
