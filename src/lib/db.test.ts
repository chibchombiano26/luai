import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("getDb", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("uses Turso client when TURSO_URL is defined and caches the instance", async () => {
    const execute = vi.fn().mockImplementation(async ({ sql }: { sql: string }) => {
      if (sql.includes("SELECT version FROM schema_migrations")) {
        return { rows: [] };
      }
      return { rows: [{ id: "row-1" }] };
    });
    const executeMultiple = vi.fn().mockResolvedValue(undefined);
    const createClient = vi.fn(() => ({
      execute,
      executeMultiple,
    }));

    vi.doMock("@libsql/client", () => ({ createClient }));
    vi.doMock("sqlite", () => ({ open: vi.fn() }));
    vi.doMock("sqlite3", () => ({ default: { Database: vi.fn() } }));
    vi.doMock("@/lib/database-provider-config", () => ({
      resolveActiveDatabaseConnectionConfig: vi.fn().mockResolvedValue({
        provider: "turso",
        source: "env",
        tursoUrl: "libsql://example.turso.io",
        tursoAuthToken: "turso-token",
        cacheKey: "turso:libsql://example.turso.io:turso-token",
      }),
    }));

    const { getDb } = await import("./db");
    const db = await getDb();
    const cachedDb = await getDb();

    expect(cachedDb).toBe(db);
    expect(createClient).toHaveBeenCalledWith({
      url: "libsql://example.turso.io",
      authToken: "turso-token",
    });
    expect(executeMultiple.mock.calls.length).toBeGreaterThanOrEqual(3);

    const row = await db.get("SELECT 1");
    expect(row).toEqual({ id: "row-1" });
    expect(execute).toHaveBeenCalledWith({ sql: "SELECT 1", args: [] });

    const rows = await db.all("SELECT * FROM table WHERE id = ?", ["abc"]);
    expect(rows).toEqual([{ id: "row-1" }]);
    expect(execute).toHaveBeenCalledWith({
      sql: "SELECT * FROM table WHERE id = ?",
      args: ["abc"],
    });

    await db.run("UPDATE table SET active = ? WHERE id = ?", [1, "abc"]);
    expect(execute).toHaveBeenCalledWith({
      sql: "UPDATE table SET active = ? WHERE id = ?",
      args: [1, "abc"],
    });

    await db.run("DELETE FROM table");
    expect(execute).toHaveBeenCalledWith({
      sql: "DELETE FROM table",
      args: [],
    });
  });

  it("uses local sqlite and applies all platform migrations when missing", async () => {
    const sqliteDb = {
      get: vi.fn().mockResolvedValue(undefined),
      all: vi.fn().mockResolvedValue([]),
      run: vi.fn().mockResolvedValue({}),
      exec: vi.fn().mockResolvedValue(undefined),
    };
    const open = vi.fn().mockResolvedValue(sqliteDb);

    vi.doMock("@libsql/client", () => ({ createClient: vi.fn() }));
    vi.doMock("sqlite", () => ({ open }));
    vi.doMock("sqlite3", () => ({ default: { Database: "MockSqliteDriver" } }));
    vi.doMock("@/lib/database-provider-config", () => ({
      resolveActiveDatabaseConnectionConfig: vi.fn().mockResolvedValue({
        provider: "sqlite",
        source: "default",
        sqlitePath: "/tmp/local-quotes.db",
        cacheKey: "sqlite:/tmp/local-quotes.db",
      }),
    }));

    const { getDb } = await import("./db");
    const db = await getDb();

    expect(open).toHaveBeenCalledWith({
      filename: "/tmp/local-quotes.db",
      driver: "MockSqliteDriver",
    });
    expect(sqliteDb.exec.mock.calls.length).toBeGreaterThanOrEqual(3);
    expect(sqliteDb.all).toHaveBeenCalledWith(
      "SELECT version FROM schema_migrations ORDER BY version",
      undefined
    );
    expect(sqliteDb.run).toHaveBeenCalledWith(
      "INSERT OR IGNORE INTO schema_migrations (version) VALUES (?)",
      ["001_initial_schema"]
    );
    expect(sqliteDb.run).toHaveBeenCalledWith(
      "INSERT OR IGNORE INTO schema_migrations (version) VALUES (?)",
      ["002_platform_settings_split"]
    );
    expect(sqliteDb.run).toHaveBeenCalledWith(
      "INSERT OR IGNORE INTO schema_migrations (version) VALUES (?)",
      ["003_drop_legacy_payload_config"]
    );

    await db.all("SELECT * FROM platform_settings");
    expect(sqliteDb.all).toHaveBeenCalledWith("SELECT * FROM platform_settings", undefined);
  });

  it("uses /tmp/quotes.db default path on Vercel when DATABASE_URL is absent", async () => {
    const sqliteDb = {
      get: vi.fn().mockResolvedValue({ id: "default", config: "{}" }),
      all: vi.fn().mockResolvedValue([
        { version: "001_initial_schema" },
        { version: "002_platform_settings_split" },
        { version: "003_drop_legacy_payload_config" },
      ]),
      run: vi.fn().mockResolvedValue({}),
      exec: vi.fn().mockResolvedValue(undefined),
    };
    const open = vi.fn().mockResolvedValue(sqliteDb);

    vi.doMock("@libsql/client", () => ({ createClient: vi.fn() }));
    vi.doMock("sqlite", () => ({ open }));
    vi.doMock("sqlite3", () => ({ default: { Database: "MockSqliteDriver" } }));
    vi.doMock("@/lib/database-provider-config", () => ({
      resolveActiveDatabaseConnectionConfig: vi.fn().mockResolvedValue({
        provider: "sqlite",
        source: "default",
        sqlitePath: "/tmp/quotes.db",
        cacheKey: "sqlite:/tmp/quotes.db",
      }),
    }));

    const { getDb } = await import("./db");
    await getDb();

    expect(open).toHaveBeenCalledWith({
      filename: "/tmp/quotes.db",
      driver: "MockSqliteDriver",
    });
    expect(sqliteDb.exec).toHaveBeenCalledTimes(1);
    expect(sqliteDb.run).not.toHaveBeenCalledWith(
      "INSERT OR IGNORE INTO schema_migrations (version) VALUES (?)",
      expect.anything()
    );
  });

  it("waits for a single shared initialization when sqlite is requested concurrently", async () => {
    let releaseInitialization: (() => void) | null = null;
    const initializationBarrier = new Promise<void>((resolve) => {
      releaseInitialization = resolve;
    });
    const sqliteDb = {
      get: vi.fn().mockResolvedValue(undefined),
      all: vi.fn().mockImplementation(async (sql: string) => {
        if (sql === "SELECT version FROM schema_migrations ORDER BY version") {
          await initializationBarrier;
          return [];
        }
        return [];
      }),
      run: vi.fn().mockResolvedValue({}),
      exec: vi.fn().mockResolvedValue(undefined),
    };
    const open = vi.fn().mockResolvedValue(sqliteDb);

    vi.doMock("@libsql/client", () => ({ createClient: vi.fn() }));
    vi.doMock("sqlite", () => ({ open }));
    vi.doMock("sqlite3", () => ({ default: { Database: "MockSqliteDriver" } }));
    vi.doMock("@/lib/database-provider-config", () => ({
      resolveActiveDatabaseConnectionConfig: vi.fn().mockResolvedValue({
        provider: "sqlite",
        source: "default",
        sqlitePath: "/tmp/local-quotes.db",
        cacheKey: "sqlite:/tmp/local-quotes.db",
      }),
    }));

    const { getDb } = await import("./db");
    const firstCall = getDb();
    const secondCall = getDb();

    await vi.waitFor(() => {
      expect(open).toHaveBeenCalledTimes(1);
    });

    releaseInitialization?.();

    const [firstDb, secondDb] = await Promise.all([firstCall, secondCall]);

    expect(firstDb).toBe(secondDb);
    expect(open).toHaveBeenCalledTimes(1);
  });
});
