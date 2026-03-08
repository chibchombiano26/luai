import type { DbInterface } from '@/lib/db';
import { createSqlAiProviderSecretRepository } from '@/lib/repositories/adapters/sql/sql-ai-provider-secret-repository';
import { createSqlPlatformSettingsRepository } from '@/lib/repositories/adapters/sql/sql-platform-settings-repository';
import { createSqlUsageEventRepository } from '@/lib/repositories/adapters/sql/sql-usage-event-repository';
import type { Repositories } from '@/lib/repositories/repository-factory';

export type DbResolver = () => Promise<DbInterface>;

export function createSqlRepositories(options: { getDb: DbResolver }): Repositories {
  return {
    aiProviderSecrets: createSqlAiProviderSecretRepository(options),
    platformSettings: createSqlPlatformSettingsRepository(options),
    usageEvents: createSqlUsageEventRepository(options),
  };
}
