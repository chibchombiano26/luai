import { Pool, type QueryResultRow } from 'pg';
import { ensurePostgresDatabaseReady } from '@/lib/database/postgres/bootstrap';
import { resolveActiveDatabaseConnectionConfig } from '@/lib/database-provider-config';

export interface PostgresClient {
  query<T extends QueryResultRow = Record<string, unknown>>(
    text: string,
    values?: unknown[]
  ): Promise<{ rows: T[] }>;
  end(): Promise<void>;
}

let postgresClient: PostgresClient | null = null;
let postgresCacheKey: string | null = null;

export async function getPostgresClient(): Promise<PostgresClient> {
  const connection = await resolveActiveDatabaseConnectionConfig();
  if (connection.provider !== 'postgres') {
    throw new Error('Active database provider is not postgres');
  }

  if (postgresClient && postgresCacheKey === connection.cacheKey) {
    return postgresClient;
  }

  const pool = new Pool({
    connectionString: connection.postgresConnectionString,
  });

  postgresClient = {
    query: async <T extends QueryResultRow = Record<string, unknown>>(
      text: string,
      values: unknown[] = []
    ) => {
      const result = await pool.query<T>(text, values);
      return { rows: result.rows };
    },
    end: async () => {
      await pool.end();
    },
  };
  postgresCacheKey = connection.cacheKey;

  await ensurePostgresDatabaseReady(postgresClient);

  return postgresClient;
}

export async function resetPostgresClient(): Promise<void> {
  if (postgresClient) {
    await postgresClient.end();
  }
  postgresClient = null;
  postgresCacheKey = null;
}
