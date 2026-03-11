
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { createClient } from "@libsql/client";
import { resolveActiveDatabaseConnectionConfig } from "@/lib/database-provider-config";
import { ensureSqlDatabaseReady } from "@/lib/database/sql/bootstrap";

// Unified interface for both SQLite and LibSQL
export type DbParam = string | number | boolean | bigint | null | Uint8Array | ArrayBuffer;
export type DbParams = DbParam[];

export interface DbInterface {
  get: (sql: string, params?: DbParams) => Promise<unknown>;
  all: (sql: string, params?: DbParams) => Promise<unknown[]>;
  run: (sql: string, params?: DbParams) => Promise<unknown>;
  exec: (sql: string) => Promise<void>;
}

let dbInstance: DbInterface | null = null;
let dbCacheKey: string | null = null;
let dbReadyPromise: Promise<void> | null = null;
let dbInitPromise: Promise<DbInterface> | null = null;
let dbInitCacheKey: string | null = null;

export function resetDbInstance(): void {
  dbInstance = null;
  dbCacheKey = null;
  dbReadyPromise = null;
  dbInitPromise = null;
  dbInitCacheKey = null;
}

export async function getDb(): Promise<DbInterface> {
  const connection = await resolveActiveDatabaseConnectionConfig();
  if (connection.provider === "postgres") {
    throw new Error("getDb does not support postgres; use the postgres repository adapter");
  }
  if (dbInstance && dbCacheKey === connection.cacheKey) {
    if (dbReadyPromise) {
      await dbReadyPromise;
    }
    return dbInstance;
  }

  if (dbInitPromise && dbInitCacheKey === connection.cacheKey) {
    return dbInitPromise;
  }

  dbInitCacheKey = connection.cacheKey;
  const initialization = (async () => {
    dbCacheKey = connection.cacheKey;

    if (connection.provider === "turso") {
      console.log(`🚀 Using Turso (LibSQL) at: ${connection.tursoUrl} (${connection.source})`);
      const client = createClient({
        url: connection.tursoUrl,
        authToken: connection.tursoAuthToken,
      });

      dbInstance = {
        get: async (sql: string, params?: DbParams): Promise<unknown> => {
          const result = await client.execute({ sql, args: params ? [...params] : [] });
          return result.rows[0];
        },
        all: async (sql: string, params?: DbParams): Promise<unknown[]> => {
          const result = await client.execute({ sql, args: params ? [...params] : [] });
          return result.rows;
        },
        run: async (sql: string, params?: DbParams) => {
          return await client.execute({ sql, args: params ? [...params] : [] });
        },
        exec: async (sql: string) => {
          // executeMultiple is often better for schema initialization
          await client.executeMultiple(sql);
        },
      };
    } else {
      const dbPath = connection.sqlitePath;
      console.log(`📂 Using local SQLite at: ${dbPath}`);

      const sqliteDb = await open({
        filename: dbPath,
        driver: sqlite3.Database,
      });

      dbInstance = {
        get: (sql: string, params?: DbParams) => sqliteDb.get(sql, params),
        all: (sql: string, params?: DbParams) => sqliteDb.all(sql, params),
        run: (sql: string, params?: DbParams) => sqliteDb.run(sql, params),
        exec: (sql: string) => sqliteDb.exec(sql),
      };
    }

    dbReadyPromise = ensureSqlDatabaseReady(dbInstance);

    try {
      await dbReadyPromise;
    } finally {
      dbReadyPromise = null;
    }

    return dbInstance;
  })();

  dbInitPromise = initialization;

  try {
    return await initialization;
  } finally {
    if (dbInitPromise === initialization) {
      dbInitPromise = null;
      dbInitCacheKey = null;
    }
  }
}
