import type { PostgresClient } from '@/lib/database/postgres/client';
import type {
  AiProviderSecretRecord,
  AiProviderSecretRepository,
} from '@/lib/repositories/ai-provider-secret-repository';

export type ClientResolver = () => Promise<PostgresClient>;

interface AiProviderSecretRow {
  providerid?: unknown;
  providerId?: unknown;
  secret?: unknown;
  updatedat?: unknown;
  updatedAt?: unknown;
}

function normalizeRow(providerId: string, row: AiProviderSecretRow | undefined): AiProviderSecretRecord | null {
  if (!row) return null;
  const rawProviderId = row.providerId ?? row.providerid;
  const rawUpdatedAt = row.updatedAt ?? row.updatedat;
  return {
    providerId: typeof rawProviderId === 'string' ? rawProviderId : providerId,
    secret: typeof row.secret === 'string' ? row.secret : null,
    updatedAt: typeof rawUpdatedAt === 'string' ? rawUpdatedAt : null,
  };
}

export function createPostgresAiProviderSecretRepository(options: {
  getClient: ClientResolver;
}): AiProviderSecretRepository {
  const { getClient } = options;

  return {
    async findByProviderId(providerId: string): Promise<AiProviderSecretRecord | null> {
      const client = await getClient();
      const result = await client.query<AiProviderSecretRow>(
        `SELECT
           provider_id AS "providerId",
           secret,
           updated_at::text AS "updatedAt"
         FROM ai_provider_secrets
         WHERE provider_id = $1`,
        [providerId]
      );
      return normalizeRow(providerId, result.rows[0]);
    },

    async save(providerId: string, secret: string): Promise<void> {
      const client = await getClient();
      await client.query(
        `INSERT INTO ai_provider_secrets (provider_id, secret, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (provider_id) DO UPDATE SET
           secret = EXCLUDED.secret,
           updated_at = CURRENT_TIMESTAMP`,
        [providerId, secret]
      );
    },

    async delete(providerId: string): Promise<void> {
      const client = await getClient();
      await client.query('DELETE FROM ai_provider_secrets WHERE provider_id = $1', [providerId]);
    },
  };
}
