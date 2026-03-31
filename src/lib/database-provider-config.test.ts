import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import os from 'os';
import path from 'path';
import {
  getDatabaseProviderStatus,
  getDefaultSqliteDatabasePath,
  resolveActiveDatabaseConnectionConfig,
  revealDatabaseProviderSecret,
  saveDatabaseProviderConfig,
} from './database-provider-config';

describe('database-provider-config', () => {
  const originalEnv = process.env;
  let runtimeDir: string;

  beforeEach(async () => {
    vi.restoreAllMocks();
    runtimeDir = await mkdtemp(path.join(os.tmpdir(), 'db-provider-config-'));
    process.env = {
      ...originalEnv,
      APP_RUNTIME_CONFIG_DIR: runtimeDir,
    };
    delete process.env.POSTGRES_URL;
    delete process.env.TURSO_URL;
    delete process.env.TURSO_AUTH_TOKEN;
    delete process.env.DATABASE_URL;
    delete process.env.VERCEL;
  });

  afterEach(async () => {
    process.env = originalEnv;
    await rm(runtimeDir, { recursive: true, force: true });
  });

  it('uses sqlite by default and resolves the default sqlite path', async () => {
    const status = await getDatabaseProviderStatus();

    expect(status.selectedProvider).toBe('sqlite');
    expect(status.source).toBe('default');
    expect(status.sqlite.path).toBe(path.join(process.cwd(), 'quotes.db'));
    await expect(resolveActiveDatabaseConnectionConfig()).resolves.toEqual({
      provider: 'sqlite',
      source: 'default',
      sqlitePath: path.join(process.cwd(), 'quotes.db'),
      cacheKey: `sqlite:${path.join(process.cwd(), 'quotes.db')}`,
    });
  });

  it('uses DATABASE_URL and Vercel tmp path when applicable', () => {
    process.env.DATABASE_URL = '/custom/db.sqlite';
    expect(getDefaultSqliteDatabasePath()).toBe('/custom/db.sqlite');

    delete process.env.DATABASE_URL;
    process.env.VERCEL = '1';
    expect(getDefaultSqliteDatabasePath()).toBe('/tmp/quotes.db');
  });

  it('uses environment postgres config when no stored admin config exists', async () => {
    process.env.POSTGRES_URL = 'postgres://env-user:secret@host:5432/app';

    await expect(getDatabaseProviderStatus()).resolves.toMatchObject({
      selectedProvider: 'postgres',
      source: 'env',
      postgres: {
        connectionString: 'postgres://env-user:secret@host:5432/app',
        hasConnectionString: true,
        credentialsSource: 'env',
      },
    });

    await expect(revealDatabaseProviderSecret('postgres')).resolves.toEqual({
      connectionString: 'postgres://env-user:secret@host:5432/app',
      source: 'env',
    });
  });

  it('persists admin postgres config and reuses it for active connections', async () => {
    const status = await saveDatabaseProviderConfig({
      selectedProvider: 'postgres',
      postgresConnectionString: 'postgres://admin-user:secret@host:5432/app',
    });

    expect(status).toMatchObject({
      selectedProvider: 'postgres',
      source: 'admin',
      postgres: {
        connectionString: 'postgres://admin-user:secret@host:5432/app',
        hasConnectionString: true,
        credentialsSource: 'admin',
      },
    });

    await expect(resolveActiveDatabaseConnectionConfig()).resolves.toEqual({
      provider: 'postgres',
      source: 'admin',
      postgresConnectionString: 'postgres://admin-user:secret@host:5432/app',
      cacheKey: 'postgres:postgres://admin-user:secret@host:5432/app',
    });
  });

  it('persists turso config and keeps credentials when switching back to sqlite', async () => {
    await saveDatabaseProviderConfig({
      selectedProvider: 'turso',
      tursoUrl: 'libsql://db.turso.io',
      tursoAuthToken: 'turso-secret',
    });

    await expect(revealDatabaseProviderSecret('turso')).resolves.toEqual({
      authToken: 'turso-secret',
      source: 'admin',
    });

    const sqliteStatus = await saveDatabaseProviderConfig({
      selectedProvider: 'sqlite',
    });
    expect(sqliteStatus.selectedProvider).toBe('sqlite');
    expect(sqliteStatus.turso.credentialsSource).toBe('admin');
  });

  it('validates required provider credentials', async () => {
    await expect(
      saveDatabaseProviderConfig({
        selectedProvider: 'postgres',
      })
    ).rejects.toThrow('Postgres connection string is required');

    await expect(
      saveDatabaseProviderConfig({
        selectedProvider: 'turso',
        tursoUrl: 'libsql://db.turso.io',
      })
    ).rejects.toThrow('Turso URL and auth token are required');
  });

  it('falls back gracefully when stored config is invalid JSON', async () => {
    const badConfigPath = path.join(runtimeDir, 'database-provider.json');
    const { writeFile } = await import('fs/promises');
    await writeFile(badConfigPath, '{"selectedProvider":"postgres","postgres":{"connectionString":""}}');

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const status = await getDatabaseProviderStatus();

    expect(status.selectedProvider).toBe('sqlite');
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
