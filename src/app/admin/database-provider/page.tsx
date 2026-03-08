'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Copy, Eye, EyeOff, RefreshCw, Save, Server } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSideNav } from '@/components/admin/AdminSideNav';
import { AppLocale, normalizeLocale } from '@/lib/i18n';
import { LEGACY_LOCALE_STORAGE_KEYS, LOCALE_STORAGE_KEY } from '@/components/chat/chat-constants';
import { getCompatStorageItem, setCompatStorageItem } from '@/lib/browser-storage';

type DatabaseProviderStatus = {
  selectedProvider: 'sqlite' | 'turso' | 'postgres';
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

const COPY: Record<
  AppLocale,
  {
    pageTitle: string;
    pageSubtitle: string;
    backToChat: string;
    loading: string;
    loadError: string;
    saveError: string;
    revealError: string;
    saved: string;
    copied: string;
    reload: string;
    currentProvider: string;
    currentSource: string;
    sqliteTitle: string;
    sqliteHint: string;
    sqlitePath: string;
    useSqlite: string;
    postgresTitle: string;
    postgresHint: string;
    postgresConnectionLabel: string;
    postgresConnectionPlaceholder: string;
    savePostgres: string;
    savedPostgresAvailable: string;
    revealPostgres: string;
    hidePostgres: string;
    copyPostgres: string;
    tursoTitle: string;
    tursoHint: string;
    tursoUrlLabel: string;
    tursoTokenLabel: string;
    tursoUrlPlaceholder: string;
    tursoTokenPlaceholder: string;
    saveTurso: string;
    savedTokenAvailable: string;
    revealToken: string;
    hideToken: string;
    copyToken: string;
    sourceAdmin: string;
    sourceEnv: string;
    sourceDefault: string;
    activeBadge: string;
    active: Record<'sqlite' | 'turso' | 'postgres', string>;
  }
> = {
  es: {
    pageTitle: 'Base de Datos',
    pageSubtitle: 'Usa SQLite por defecto o configura una conexión Turso o PostgreSQL desde admin.',
    backToChat: 'Volver al chat',
    loading: 'Cargando configuración de base de datos...',
    loadError: 'Error al cargar la configuración de base de datos',
    saveError: 'Error al guardar la configuración de base de datos',
    revealError: 'Error al revelar el token',
    saved: 'Configuración guardada ✓',
    copied: 'Token copiado ✓',
    reload: 'Recargar',
    currentProvider: 'Proveedor activo',
    currentSource: 'Origen',
    sqliteTitle: 'SQLite',
    sqliteHint: 'Fallback local del host. Se usa por defecto cuando no hay otra base configurada.',
    sqlitePath: 'Ruta del archivo',
    useSqlite: 'Usar SQLite',
    postgresTitle: 'PostgreSQL',
    postgresHint: 'Configura un connection string de PostgreSQL. Se mantiene oculto por defecto.',
    postgresConnectionLabel: 'POSTGRES_URL',
    postgresConnectionPlaceholder: 'postgres://user:password@host:5432/database',
    savePostgres: 'Guardar y usar PostgreSQL',
    savedPostgresAvailable: 'Hay un connection string disponible para PostgreSQL.',
    revealPostgres: 'Mostrar connection string',
    hidePostgres: 'Ocultar connection string',
    copyPostgres: 'Copiar connection string',
    tursoTitle: 'Turso',
    tursoHint: 'Configura URL y token de Turso. El token queda oculto por defecto.',
    tursoUrlLabel: 'TURSO_URL',
    tursoTokenLabel: 'TURSO_AUTH_TOKEN',
    tursoUrlPlaceholder: 'libsql://tu-db.turso.io',
    tursoTokenPlaceholder: 'Pega el token de Turso',
    saveTurso: 'Guardar y usar Turso',
    savedTokenAvailable: 'Hay un token disponible para Turso.',
    revealToken: 'Mostrar token',
    hideToken: 'Ocultar token',
    copyToken: 'Copiar token',
    sourceAdmin: 'Guardado desde admin',
    sourceEnv: 'Cargado desde variables de entorno',
    sourceDefault: 'Fallback local por defecto',
    activeBadge: 'Activo',
    active: {
      sqlite: 'SQLite',
      postgres: 'PostgreSQL',
      turso: 'Turso',
    },
  },
  en: {
    pageTitle: 'Database',
    pageSubtitle: 'Use SQLite by default or configure a Turso or PostgreSQL connection from admin.',
    backToChat: 'Back to chat',
    loading: 'Loading database configuration...',
    loadError: 'Error loading database configuration',
    saveError: 'Error saving database configuration',
    revealError: 'Error revealing token',
    saved: 'Configuration saved ✓',
    copied: 'Token copied ✓',
    reload: 'Reload',
    currentProvider: 'Active provider',
    currentSource: 'Source',
    sqliteTitle: 'SQLite',
    sqliteHint: 'Local host fallback. Used by default when no other database is configured.',
    sqlitePath: 'File path',
    useSqlite: 'Use SQLite',
    postgresTitle: 'PostgreSQL',
    postgresHint: 'Configure a PostgreSQL connection string. It stays hidden by default.',
    postgresConnectionLabel: 'POSTGRES_URL',
    postgresConnectionPlaceholder: 'postgres://user:password@host:5432/database',
    savePostgres: 'Save and use PostgreSQL',
    savedPostgresAvailable: 'A PostgreSQL connection string is available.',
    revealPostgres: 'Show connection string',
    hidePostgres: 'Hide connection string',
    copyPostgres: 'Copy connection string',
    tursoTitle: 'Turso',
    tursoHint: 'Configure Turso URL and token. The token stays hidden by default.',
    tursoUrlLabel: 'TURSO_URL',
    tursoTokenLabel: 'TURSO_AUTH_TOKEN',
    tursoUrlPlaceholder: 'libsql://your-db.turso.io',
    tursoTokenPlaceholder: 'Paste the Turso token',
    saveTurso: 'Save and use Turso',
    savedTokenAvailable: 'A Turso token is available.',
    revealToken: 'Show token',
    hideToken: 'Hide token',
    copyToken: 'Copy token',
    sourceAdmin: 'Saved in admin',
    sourceEnv: 'Loaded from environment variables',
    sourceDefault: 'Default local fallback',
    activeBadge: 'Active',
    active: {
      sqlite: 'SQLite',
      postgres: 'PostgreSQL',
      turso: 'Turso',
    },
  },
};

function resolveSourceLabel(locale: AppLocale, source: DatabaseProviderStatus['source']): string {
  const t = COPY[locale];
  if (source === 'admin') return t.sourceAdmin;
  if (source === 'env') return t.sourceEnv;
  return t.sourceDefault;
}

export default function AdminDatabaseProviderPage() {
  const [locale, setLocale] = useState<AppLocale>('es');
  const [status, setStatus] = useState<DatabaseProviderStatus | null>(null);
  const [tursoUrl, setTursoUrl] = useState('');
  const [tursoToken, setTursoToken] = useState('');
  const [isTokenVisible, setIsTokenVisible] = useState(false);
  const [postgresConnectionString, setPostgresConnectionString] = useState('');
  const [isPostgresVisible, setIsPostgresVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRevealingToken, setIsRevealingToken] = useState(false);
  const [isRevealingPostgres, setIsRevealingPostgres] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const t = COPY[locale];

  const loadStatus = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/database-provider');
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message =
          typeof payload.error === 'string' && payload.error.trim() ? payload.error : t.loadError;
        throw new Error(message);
      }

      const payload = await response.json();
      const nextStatus = payload.status as DatabaseProviderStatus | undefined;
      if (nextStatus) {
        setStatus(nextStatus);
        setTursoUrl(nextStatus.turso.url ?? '');
        setPostgresConnectionString(nextStatus.postgres.connectionString ?? '');
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t.loadError);
      console.error(loadError);
    } finally {
      setIsLoading(false);
    }
  }, [t.loadError]);

  useEffect(() => {
    const storedLocale = getCompatStorageItem(
      localStorage,
      LOCALE_STORAGE_KEY,
      LEGACY_LOCALE_STORAGE_KEYS
    );
    if (storedLocale) {
      setLocale(normalizeLocale(storedLocale));
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const changeLocale = (nextLocale: AppLocale) => {
    setLocale(nextLocale);
    setCompatStorageItem(localStorage, LOCALE_STORAGE_KEY, nextLocale, LEGACY_LOCALE_STORAGE_KEYS);
    document.cookie = `app_locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
  };

  const setSuccessMessage = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleUseSqlite = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/database-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedProvider: 'sqlite',
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message =
          typeof payload.error === 'string' && payload.error.trim() ? payload.error : t.saveError;
        throw new Error(message);
      }

      const payload = await response.json();
      setStatus(payload.status as DatabaseProviderStatus);
      setSuccessMessage(t.saved);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t.saveError);
      console.error(saveError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTurso = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/database-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedProvider: 'turso',
          tursoUrl,
          tursoAuthToken: tursoToken,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message =
          typeof payload.error === 'string' && payload.error.trim() ? payload.error : t.saveError;
        throw new Error(message);
      }

      const payload = await response.json();
      setStatus(payload.status as DatabaseProviderStatus);
      setSuccessMessage(t.saved);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t.saveError);
      console.error(saveError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePostgres = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/database-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedProvider: 'postgres',
          postgresConnectionString,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message =
          typeof payload.error === 'string' && payload.error.trim() ? payload.error : t.saveError;
        throw new Error(message);
      }

      const payload = await response.json();
      setStatus(payload.status as DatabaseProviderStatus);
      setSuccessMessage(t.saved);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t.saveError);
      console.error(saveError);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleTokenVisibility = async () => {
    if (isTokenVisible) {
      setIsTokenVisible(false);
      return;
    }

    setIsRevealingToken(true);
    setError('');

    try {
      const response = await fetch('/api/admin/database-provider?includeSecret=1&provider=turso');
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message =
          typeof payload.error === 'string' && payload.error.trim() ? payload.error : t.revealError;
        throw new Error(message);
      }

      const payload = await response.json();
      setTursoToken(typeof payload.authToken === 'string' ? payload.authToken : '');
      setIsTokenVisible(true);
    } catch (revealError) {
      setError(revealError instanceof Error ? revealError.message : t.revealError);
      console.error(revealError);
    } finally {
      setIsRevealingToken(false);
    }
  };

  const handleCopyToken = async () => {
    if (!tursoToken) return;

    try {
      await navigator.clipboard.writeText(tursoToken);
      setSuccessMessage(t.copied);
    } catch (copyError) {
      setError(copyError instanceof Error ? copyError.message : t.revealError);
      console.error(copyError);
    }
  };

  const handleTogglePostgresVisibility = async () => {
    if (isPostgresVisible) {
      setIsPostgresVisible(false);
      return;
    }

    setIsRevealingPostgres(true);
    setError('');

    try {
      const response = await fetch('/api/admin/database-provider?includeSecret=1&provider=postgres');
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message =
          typeof payload.error === 'string' && payload.error.trim() ? payload.error : t.revealError;
        throw new Error(message);
      }

      const payload = await response.json();
      setPostgresConnectionString(typeof payload.connectionString === 'string' ? payload.connectionString : '');
      setIsPostgresVisible(true);
    } catch (revealError) {
      setError(revealError instanceof Error ? revealError.message : t.revealError);
      console.error(revealError);
    } finally {
      setIsRevealingPostgres(false);
    }
  };

  const handleCopyPostgresConnectionString = async () => {
    if (!postgresConnectionString) return;

    try {
      await navigator.clipboard.writeText(postgresConnectionString);
      setSuccessMessage(t.copied);
    } catch (copyError) {
      setError(copyError instanceof Error ? copyError.message : t.revealError);
      console.error(copyError);
    }
  };

  return (
    <main className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <AdminPageHeader
        locale={locale}
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
        backLabel={t.backToChat}
        onChangeLocale={changeLocale}
      />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside>
            <AdminSideNav locale={locale} />
          </aside>

          <section className="min-w-0 max-w-4xl space-y-6">

          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-zinc-500" />
                  <h2 className="text-lg font-semibold">{t.currentProvider}</h2>
                </div>
                {status ? (
                  <div className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                    <p>
                      {t.activeBadge}: <span className="font-medium text-zinc-900 dark:text-zinc-100">{t.active[status.selectedProvider]}</span>
                    </p>
                    <p>
                      {t.currentSource}: <span className="font-medium text-zinc-900 dark:text-zinc-100">{resolveSourceLabel(locale, status.source)}</span>
                    </p>
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => void loadStatus()}
                className="inline-flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <RefreshCw className="h-4 w-4" />
                {t.reload}
              </button>
            </div>

            {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
            {success ? <p className="mt-4 text-sm text-emerald-600">{success}</p> : null}

            {isLoading ? (
              <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">{t.loading}</p>
            ) : (
              <div className="mt-6 space-y-4">
                <article className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold">{t.sqliteTitle}</h3>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t.sqliteHint}</p>
                    </div>
                    {status?.selectedProvider === 'sqlite' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t.activeBadge}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{t.sqlitePath}:</p>
                    <div className="rounded-md bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-700 break-all dark:bg-zinc-950 dark:text-zinc-300">
                      {status?.sqlite.path}
                    </div>
                  </div>
                  <button
                    type="button"
                    data-testid="use-sqlite"
                    onClick={() => void handleUseSqlite()}
                    disabled={isSaving}
                    className="mt-4 inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Save className="h-4 w-4" />
                    {t.useSqlite}
                  </button>
                </article>

                <article className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold">{t.postgresTitle}</h3>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t.postgresHint}</p>
                    </div>
                    {status?.selectedProvider === 'postgres' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t.activeBadge}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="postgres-url" className="block text-sm font-medium">
                        {t.postgresConnectionLabel}
                      </label>
                      <input
                        id="postgres-url"
                        data-testid="postgres-connection-input"
                        type={isPostgresVisible ? 'text' : 'password'}
                        autoComplete="off"
                        value={postgresConnectionString}
                        onChange={(event) => setPostgresConnectionString(event.target.value)}
                        placeholder={t.postgresConnectionPlaceholder}
                        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                      />
                      {status?.postgres.hasConnectionString ? (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t.savedPostgresAvailable}</p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {status?.postgres.hasConnectionString ? (
                        <button
                          type="button"
                          data-testid="toggle-postgres-visibility"
                          onClick={() => void handleTogglePostgresVisibility()}
                          disabled={isRevealingPostgres}
                          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                        >
                          {isPostgresVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {isPostgresVisible ? t.hidePostgres : t.revealPostgres}
                        </button>
                      ) : null}
                      {isPostgresVisible && postgresConnectionString ? (
                        <button
                          type="button"
                          data-testid="copy-postgres-connection"
                          onClick={() => void handleCopyPostgresConnectionString()}
                          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                        >
                          <Copy className="h-4 w-4" />
                          {t.copyPostgres}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        data-testid="save-postgres"
                        onClick={() => void handleSavePostgres()}
                        disabled={isSaving || (!postgresConnectionString.trim() && !status?.postgres.hasConnectionString)}
                        className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                      >
                        <Save className="h-4 w-4" />
                        {t.savePostgres}
                      </button>
                    </div>
                  </div>
                </article>

                <article className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold">{t.tursoTitle}</h3>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t.tursoHint}</p>
                    </div>
                    {status?.selectedProvider === 'turso' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t.activeBadge}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="turso-url" className="block text-sm font-medium">
                        {t.tursoUrlLabel}
                      </label>
                      <input
                        id="turso-url"
                        data-testid="turso-url-input"
                        type="text"
                        value={tursoUrl}
                        onChange={(event) => setTursoUrl(event.target.value)}
                        placeholder={t.tursoUrlPlaceholder}
                        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="turso-token" className="block text-sm font-medium">
                        {t.tursoTokenLabel}
                      </label>
                      <input
                        id="turso-token"
                        data-testid="turso-token-input"
                        type={isTokenVisible ? 'text' : 'password'}
                        autoComplete="off"
                        value={tursoToken}
                        onChange={(event) => setTursoToken(event.target.value)}
                        placeholder={t.tursoTokenPlaceholder}
                        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                      />
                      {status?.turso.hasAuthToken ? (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t.savedTokenAvailable}</p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {status?.turso.hasAuthToken ? (
                        <button
                          type="button"
                          data-testid="toggle-token-visibility"
                          onClick={() => void handleToggleTokenVisibility()}
                          disabled={isRevealingToken}
                          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                        >
                          {isTokenVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {isTokenVisible ? t.hideToken : t.revealToken}
                        </button>
                      ) : null}
                      {isTokenVisible && tursoToken ? (
                        <button
                          type="button"
                          data-testid="copy-token"
                          onClick={() => void handleCopyToken()}
                          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                        >
                          <Copy className="h-4 w-4" />
                          {t.copyToken}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        data-testid="save-turso"
                        onClick={() => void handleSaveTurso()}
                        disabled={isSaving || !tursoUrl.trim() || (!tursoToken.trim() && !status?.turso.hasAuthToken)}
                        className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                      >
                        <Save className="h-4 w-4" />
                        {t.saveTurso}
                      </button>
                    </div>
                  </div>
                </article>
              </div>
            )}
          </div>
          </section>
        </div>
      </div>
    </main>
  );
}
