import path from 'path';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { z } from 'zod';

export type DatabaseProviderId = 'sqlite' | 'turso' | 'postgres';

export type DatabaseProviderStatus = {
  selectedProvider: DatabaseProviderId;
  source: 'admin' | 'env' | 'default';
  sqlite: {
    path: string;
  };
  turso: {
    url: string;
    hasAuthToken: boolean;
    credentialsSource: 'admin' | 'env' | null;
  };
  postgres: {
    connectionString: string;
    hasConnectionString: boolean;
    credentialsSource: 'admin' | 'env' | null;
  };
};

type StoredDatabaseProviderConfig = {
  version: 1;
  selectedProvider: DatabaseProviderId;
  turso?: {
    url: string;
    authToken: string;
  };
  postgres?: {
    connectionString: string;
  };
};

/** Resolved runtime database connection after combining admin and environment config. */
export type ActiveDatabaseConnectionConfig =
  | {
      provider: 'sqlite';
      source: 'admin' | 'default';
      sqlitePath: string;
      cacheKey: string;
    }
  | {
      provider: 'turso';
      source: 'admin' | 'env';
      tursoUrl: string;
      tursoAuthToken: string;
      cacheKey: string;
    }
  | {
      provider: 'postgres';
      source: 'admin' | 'env';
      postgresConnectionString: string;
      cacheKey: string;
    };

const StoredDatabaseProviderConfigSchema = z.object({
  version: z.literal(1).default(1),
  selectedProvider: z.enum(['sqlite', 'turso', 'postgres']),
  turso: z
    .object({
      url: z.string().trim().min(1),
      authToken: z.string().trim().min(1),
    })
    .optional(),
  postgres: z
    .object({
      connectionString: z.string().trim().min(1),
    })
    .optional(),
});

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function getRuntimeConfigDir(): string {
  return process.env.APP_RUNTIME_CONFIG_DIR?.trim() || path.join(process.cwd(), '.runtime-config');
}

function getDatabaseProviderConfigPath(): string {
  return path.join(getRuntimeConfigDir(), 'database-provider.json');
}

export function getDefaultSqliteDatabasePath(): string {
  const isVercel = process.env.VERCEL === '1';
  const defaultPath = isVercel ? path.join('/tmp', 'quotes.db') : path.join(process.cwd(), 'quotes.db');
  return process.env.DATABASE_URL || defaultPath;
}

async function readStoredDatabaseProviderConfig(): Promise<StoredDatabaseProviderConfig | null> {
  try {
    const raw = await readFile(getDatabaseProviderConfigPath(), 'utf-8');
    const parsed = JSON.parse(raw) as unknown;
    const result = StoredDatabaseProviderConfigSchema.safeParse(parsed);
    if (!result.success) {
      return null;
    }
    return result.data;
  } catch (error) {
    const maybeNodeError = error as NodeJS.ErrnoException;
    if (maybeNodeError?.code === 'ENOENT') {
      return null;
    }
    console.error('Failed to read database provider config:', error);
    return null;
  }
}

async function writeStoredDatabaseProviderConfig(config: StoredDatabaseProviderConfig): Promise<void> {
  const runtimeConfigDir = getRuntimeConfigDir();
  await mkdir(runtimeConfigDir, { recursive: true });
  await writeFile(getDatabaseProviderConfigPath(), JSON.stringify(config, null, 2), {
    encoding: 'utf-8',
    mode: 0o600,
  });
}

function getEnvTursoCredentials(): { url: string | null; authToken: string | null } {
  return {
    url: normalizeString(process.env.TURSO_URL),
    authToken: normalizeString(process.env.TURSO_AUTH_TOKEN),
  };
}

function getEnvPostgresConnectionString(): string | null {
  return normalizeString(process.env.POSTGRES_URL);
}

export async function getDatabaseProviderStatus(): Promise<DatabaseProviderStatus> {
  const sqlitePath = getDefaultSqliteDatabasePath();
  const stored = await readStoredDatabaseProviderConfig();
  const envTurso = getEnvTursoCredentials();
  const envPostgresConnectionString = getEnvPostgresConnectionString();

  let selectedProvider: DatabaseProviderId = 'sqlite';
  let source: DatabaseProviderStatus['source'] = 'default';

  if (stored) {
    if (stored.selectedProvider === 'turso' && stored.turso?.url && stored.turso?.authToken) {
      selectedProvider = 'turso';
    } else if (stored.selectedProvider === 'postgres' && stored.postgres?.connectionString) {
      selectedProvider = 'postgres';
    } else {
      selectedProvider = 'sqlite';
    }
    source = 'admin';
  } else if (envPostgresConnectionString) {
    selectedProvider = 'postgres';
    source = 'env';
  } else if (envTurso.url && envTurso.authToken) {
    selectedProvider = 'turso';
    source = 'env';
  }

  return {
    selectedProvider,
    source,
    sqlite: {
      path: sqlitePath,
    },
    turso: {
      url: stored?.turso?.url ?? envTurso.url ?? '',
      hasAuthToken: Boolean(stored?.turso?.authToken || envTurso.authToken),
      credentialsSource: stored?.turso?.authToken ? 'admin' : envTurso.authToken ? 'env' : null,
    },
    postgres: {
      connectionString: stored?.postgres?.connectionString ?? envPostgresConnectionString ?? '',
      hasConnectionString: Boolean(stored?.postgres?.connectionString || envPostgresConnectionString),
      credentialsSource: stored?.postgres?.connectionString ? 'admin' : envPostgresConnectionString ? 'env' : null,
    },
  };
}

export async function revealDatabaseProviderSecret(providerId: 'turso' | 'postgres'): Promise<{
  authToken?: string | null;
  connectionString?: string | null;
  source: 'admin' | 'env' | null;
}> {
  const stored = await readStoredDatabaseProviderConfig();
  if (providerId === 'turso' && stored?.turso?.authToken) {
    return {
      authToken: stored.turso.authToken,
      source: 'admin',
    };
  }

  if (providerId === 'postgres' && stored?.postgres?.connectionString) {
    return {
      connectionString: stored.postgres.connectionString,
      source: 'admin',
    };
  }

  const envTurso = getEnvTursoCredentials();
  const envPostgresConnectionString = getEnvPostgresConnectionString();
  if (providerId === 'postgres') {
    return {
      connectionString: envPostgresConnectionString,
      source: envPostgresConnectionString ? 'env' : null,
    };
  }

  return {
    authToken: envTurso.authToken,
    source: envTurso.authToken ? 'env' : null,
  };
}

export async function saveDatabaseProviderConfig(
  input:
    | {
        selectedProvider: 'sqlite';
      }
    | {
        selectedProvider: 'turso';
        tursoUrl: string;
        tursoAuthToken?: string | null;
      }
    | {
        selectedProvider: 'postgres';
        postgresConnectionString?: string | null;
      }
): Promise<DatabaseProviderStatus> {
  const existing = await readStoredDatabaseProviderConfig();

  if (input.selectedProvider === 'sqlite') {
    await writeStoredDatabaseProviderConfig({
      version: 1,
      selectedProvider: 'sqlite',
      turso: existing?.turso,
      postgres: existing?.postgres,
    });
    return getDatabaseProviderStatus();
  }

  if (input.selectedProvider === 'postgres') {
    const nextConnectionString =
      normalizeString(input.postgresConnectionString) ?? existing?.postgres?.connectionString ?? null;

    if (!nextConnectionString) {
      throw new Error('Postgres connection string is required');
    }

    await writeStoredDatabaseProviderConfig({
      version: 1,
      selectedProvider: 'postgres',
      turso: existing?.turso,
      postgres: {
        connectionString: nextConnectionString,
      },
    });

    return getDatabaseProviderStatus();
  }

  const nextUrl = normalizeString(input.tursoUrl);
  const nextToken = normalizeString(input.tursoAuthToken) ?? existing?.turso?.authToken ?? null;

  if (!nextUrl || !nextToken) {
    throw new Error('Turso URL and auth token are required');
  }

  await writeStoredDatabaseProviderConfig({
    version: 1,
    selectedProvider: 'turso',
    turso: {
      url: nextUrl,
      authToken: nextToken,
    },
    postgres: existing?.postgres,
  });

  return getDatabaseProviderStatus();
}

export async function resolveActiveDatabaseConnectionConfig(): Promise<ActiveDatabaseConnectionConfig> {
  const stored = await readStoredDatabaseProviderConfig();
  const sqlitePath = getDefaultSqliteDatabasePath();
  const envPostgresConnectionString = getEnvPostgresConnectionString();

  if (stored) {
    if (stored.selectedProvider === 'turso' && stored.turso?.url && stored.turso?.authToken) {
      return {
        provider: 'turso',
        source: 'admin',
        tursoUrl: stored.turso.url,
        tursoAuthToken: stored.turso.authToken,
        cacheKey: `turso:${stored.turso.url}:${stored.turso.authToken}`,
      };
    }

    if (stored.selectedProvider === 'postgres' && stored.postgres?.connectionString) {
      return {
        provider: 'postgres',
        source: 'admin',
        postgresConnectionString: stored.postgres.connectionString,
        cacheKey: `postgres:${stored.postgres.connectionString}`,
      };
    }

    return {
      provider: 'sqlite',
      source: 'admin',
      sqlitePath,
      cacheKey: `sqlite:${sqlitePath}`,
    };
  }

  if (envPostgresConnectionString) {
    return {
      provider: 'postgres',
      source: 'env',
      postgresConnectionString: envPostgresConnectionString,
      cacheKey: `postgres:${envPostgresConnectionString}`,
    };
  }

  const envTurso = getEnvTursoCredentials();
  if (envTurso.url && envTurso.authToken) {
    return {
      provider: 'turso',
      source: 'env',
      tursoUrl: envTurso.url,
      tursoAuthToken: envTurso.authToken,
      cacheKey: `turso:${envTurso.url}:${envTurso.authToken}`,
    };
  }

  return {
    provider: 'sqlite',
    source: 'default',
    sqlitePath,
    cacheKey: `sqlite:${sqlitePath}`,
  };
}
