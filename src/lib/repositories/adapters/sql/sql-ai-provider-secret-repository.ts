import type { DbInterface } from '@/lib/db';
import type {
  AiProviderSecretRecord,
  AiProviderSecretRepository,
} from '@/lib/repositories/ai-provider-secret-repository';

export type DbResolver = () => Promise<DbInterface>;

interface AiProviderSecretRow {
  provider_id?: unknown;
  providerId?: unknown;
  secret?: unknown;
  updated_at?: unknown;
  updatedAt?: unknown;
}

function normalizeAiProviderSecretRow(
  providerId: string,
  row: AiProviderSecretRow | undefined
): AiProviderSecretRecord | null {
  if (!row) {
    return null;
  }

  const rawProviderId = row.provider_id ?? row.providerId;
  const rawUpdatedAt = row.updated_at ?? row.updatedAt;

  return {
    providerId: typeof rawProviderId === 'string' ? rawProviderId : providerId,
    secret: typeof row.secret === 'string' ? row.secret : null,
    updatedAt: typeof rawUpdatedAt === 'string' ? rawUpdatedAt : null,
  };
}

export function createSqlAiProviderSecretRepository(options: {
  getDb: DbResolver;
}): AiProviderSecretRepository {
  const { getDb } = options;

  const hasByProviderId = async (providerId: string): Promise<boolean> => {
    const db = await getDb();
    const row = (await db.get('SELECT provider_id FROM ai_provider_secrets WHERE provider_id = ?', [
      providerId,
    ])) as { provider_id?: unknown } | undefined;

    return typeof row?.provider_id === 'string';
  };

  const findByProviderId = async (providerId: string): Promise<AiProviderSecretRecord | null> => {
    const db = await getDb();
    const row = (await db.get(
      `SELECT
        provider_id,
        secret,
        updated_at
      FROM ai_provider_secrets
      WHERE provider_id = ?`,
      [providerId]
    )) as AiProviderSecretRow | undefined;

    return normalizeAiProviderSecretRow(providerId, row);
  };

  const save = async (providerId: string, secret: string): Promise<void> => {
    const db = await getDb();
    const existing = await hasByProviderId(providerId);

    if (existing) {
      await db.run(
        'UPDATE ai_provider_secrets SET secret = ?, updated_at = CURRENT_TIMESTAMP WHERE provider_id = ?',
        [secret, providerId]
      );
      return;
    }

    await db.run(
      'INSERT INTO ai_provider_secrets (provider_id, secret, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [providerId, secret]
    );
  };

  const remove = async (providerId: string): Promise<void> => {
    const db = await getDb();
    await db.run('DELETE FROM ai_provider_secrets WHERE provider_id = ?', [providerId]);
  };

  return {
    findByProviderId,
    save,
    delete: remove,
  };
}
