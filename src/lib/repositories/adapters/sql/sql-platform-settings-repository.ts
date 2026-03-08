import type { DbInterface } from '@/lib/db';
import type {
  PlatformSettingsRecord,
  PlatformSettingsRepository,
} from '@/lib/repositories/platform-settings-repository';

export type DbResolver = () => Promise<DbInterface>;

interface PlatformSettingsRow {
  id?: unknown;
  config?: unknown;
  updated_at?: unknown;
  updatedAt?: unknown;
}

function normalizePlatformSettingsRow(
  id: string,
  row: PlatformSettingsRow | undefined
): PlatformSettingsRecord | null {
  if (!row) {
    return null;
  }

  const rawUpdatedAt = typeof row.updated_at === 'string' ? row.updated_at : row.updatedAt;

  return {
    id: typeof row.id === 'string' ? row.id : id,
    config: typeof row.config === 'string' ? row.config : '',
    updatedAt: typeof rawUpdatedAt === 'string' ? rawUpdatedAt : null,
  };
}

export function createSqlPlatformSettingsRepository(options: {
  getDb: DbResolver;
}): PlatformSettingsRepository {
  const { getDb } = options;

  const hasById = async (id: string): Promise<boolean> => {
    const db = await getDb();
    const row = (await db.get('SELECT id FROM platform_settings WHERE id = ?', [id])) as
      | { id?: unknown }
      | undefined;

    return typeof row?.id === 'string';
  };

  const findById = async (id: string): Promise<PlatformSettingsRecord | null> => {
    const db = await getDb();
    const row = (await db.get(
      `SELECT
        id,
        config,
        updated_at
      FROM platform_settings
      WHERE id = ?`,
      [id]
    )) as PlatformSettingsRow | undefined;

    return normalizePlatformSettingsRow(id, row);
  };

  const save = async (id: string, config: string): Promise<void> => {
    const db = await getDb();
    const existing = await hasById(id);

    if (existing) {
      await db.run(
        'UPDATE platform_settings SET config = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [config, id]
      );
      return;
    }

    await db.run('INSERT INTO platform_settings (id, config) VALUES (?, ?)', [id, config]);
  };

  return {
    findById,
    save,
  };
}
