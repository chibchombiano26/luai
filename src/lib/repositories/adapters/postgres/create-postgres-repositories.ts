import type { PostgresClient } from '@/lib/database/postgres/client';
import { createPostgresAiProviderSecretRepository } from '@/lib/repositories/adapters/postgres/postgres-ai-provider-secret-repository';
import { createPostgresPlatformSettingsRepository } from '@/lib/repositories/adapters/postgres/postgres-platform-settings-repository';
import { createPostgresUsageEventRepository } from '@/lib/repositories/adapters/postgres/postgres-usage-event-repository';
import type { Repositories } from '@/lib/repositories/repository-factory';

export type ClientResolver = () => Promise<PostgresClient>;

export function createPostgresRepositories(options: { getClient: ClientResolver }): Repositories {
  return {
    aiProviderSecrets: createPostgresAiProviderSecretRepository(options),
    platformSettings: createPostgresPlatformSettingsRepository(options),
    usageEvents: createPostgresUsageEventRepository(options),
  };
}
