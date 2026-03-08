import { getDb } from '@/lib/db';
import { getPostgresClient } from '@/lib/database/postgres/client';
import { resolveActiveDatabaseConnectionConfig } from '@/lib/database-provider-config';
import type { AiProviderSecretRepository } from '@/lib/repositories/ai-provider-secret-repository';
import { createPostgresRepositories } from '@/lib/repositories/adapters/postgres/create-postgres-repositories';
import { createSqlRepositories } from '@/lib/repositories/adapters/sql/create-sql-repositories';
import type { PlatformSettingsRepository } from '@/lib/repositories/platform-settings-repository';
import type { UsageEventRepository } from '@/lib/repositories/usage-event-repository';

export type RepositoryAdapterKind = 'sql' | 'postgres';

export interface Repositories {
  aiProviderSecrets: AiProviderSecretRepository;
  platformSettings: PlatformSettingsRepository;
  usageEvents: UsageEventRepository;
}

export interface RepositoryFactory {
  adapter: RepositoryAdapterKind;
  provider: 'sqlite' | 'turso' | 'postgres';
  repositories: Repositories;
}

let cachedFactory: RepositoryFactory | null = null;
let cachedFactoryKey: string | null = null;

function resolveAdapterKind(provider: 'sqlite' | 'turso' | 'postgres'): RepositoryAdapterKind {
  switch (provider) {
    case 'sqlite':
    case 'turso':
      return 'sql';
    case 'postgres':
      return 'postgres';
  }
}

export function resetRepositoryFactory(): void {
  cachedFactory = null;
  cachedFactoryKey = null;
}

export async function getRepositoryFactory(): Promise<RepositoryFactory> {
  const connection = await resolveActiveDatabaseConnectionConfig();
  const adapter = resolveAdapterKind(connection.provider);
  const cacheKey = `${adapter}:${connection.cacheKey}`;

  if (cachedFactory && cachedFactoryKey === cacheKey) {
    return cachedFactory;
  }

  cachedFactory = {
    adapter,
    provider: connection.provider,
    repositories:
      adapter === 'postgres'
        ? createPostgresRepositories({ getClient: getPostgresClient })
        : createSqlRepositories({ getDb }),
  };
  cachedFactoryKey = cacheKey;

  return cachedFactory;
}

export async function getRepositories(): Promise<Repositories> {
  return (await getRepositoryFactory()).repositories;
}
