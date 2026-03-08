'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Save, Trash2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSideNav } from '@/components/admin/AdminSideNav';
import { AppLocale, normalizeLocale } from '@/lib/i18n';
import { LEGACY_LOCALE_STORAGE_KEYS, LOCALE_STORAGE_KEY } from '@/components/chat/chat-constants';
import { getCompatStorageItem, setCompatStorageItem } from '@/lib/browser-storage';

type AiProviderSummary = {
  id: string;
  label: Record<AppLocale, string>;
  configured: boolean;
  hasStoredSecret: boolean;
  configuredVia: 'admin' | 'env' | null;
  updatedAt: string | null;
};

const COPY: Record<
  AppLocale,
  {
    pageTitle: string;
    pageSubtitle: string;
    backToChat: string;
    sectionTitle: string;
    sectionHint: string;
    loading: string;
    loadError: string;
    saveError: string;
    deleteError: string;
    saved: string;
    deleted: string;
    reload: string;
    saveKey: string;
    deleteKey: string;
    inputLabel: string;
    inputPlaceholder: string;
    savedKeyAvailable: string;
    notConfigured: string;
    configuredInAdmin: string;
    configuredViaEnv: string;
    lastUpdated: string;
    emptyState: string;
  }
> = {
  es: {
    pageTitle: 'Proveedores AI',
    pageSubtitle: 'Guarda credenciales de proveedores de AI sin exponer la key en la interfaz.',
    backToChat: 'Volver al chat',
    sectionTitle: 'Proveedores configurados',
    sectionHint: 'La key solo se puede guardar. Nunca se muestra nuevamente desde el admin.',
    loading: 'Cargando proveedores...',
    loadError: 'Error al cargar proveedores AI',
    saveError: 'Error al guardar la key',
    deleteError: 'Error al eliminar la key',
    saved: 'Key guardada ✓',
    deleted: 'Key eliminada ✓',
    reload: 'Recargar',
    saveKey: 'Guardar key',
    deleteKey: 'Eliminar key guardada',
    inputLabel: 'Nueva API key',
    inputPlaceholder: 'Pega una nueva key',
    savedKeyAvailable: 'Ya existe una key guardada para este proveedor.',
    notConfigured: 'Sin configurar',
    configuredInAdmin: 'Configurado desde admin',
    configuredViaEnv: 'Usando fallback por variable de entorno',
    lastUpdated: 'Última actualización',
    emptyState: 'No hay proveedores AI configurados.',
  },
  en: {
    pageTitle: 'AI Providers',
    pageSubtitle: 'Store AI provider credentials without exposing the key in the interface.',
    backToChat: 'Back to chat',
    sectionTitle: 'Configured providers',
    sectionHint: 'Keys can only be saved. They are never shown again in admin.',
    loading: 'Loading providers...',
    loadError: 'Error loading AI providers',
    saveError: 'Error saving key',
    deleteError: 'Error deleting key',
    saved: 'Key saved ✓',
    deleted: 'Key deleted ✓',
    reload: 'Reload',
    saveKey: 'Save key',
    deleteKey: 'Delete saved key',
    inputLabel: 'New API key',
    inputPlaceholder: 'Paste a new key',
    savedKeyAvailable: 'A saved key already exists for this provider.',
    notConfigured: 'Not configured',
    configuredInAdmin: 'Configured in admin',
    configuredViaEnv: 'Using environment variable fallback',
    lastUpdated: 'Last updated',
    emptyState: 'No AI providers configured.',
  },
};

function formatUpdatedAt(value: string | null, locale: AppLocale): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(locale === 'es' ? 'es-CO' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminAiProvidersPage() {
  const [locale, setLocale] = useState<AppLocale>('es');
  const [providers, setProviders] = useState<AiProviderSummary[]>([]);
  const [inputByProviderId, setInputByProviderId] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingProviderId, setSavingProviderId] = useState<string | null>(null);
  const [deletingProviderId, setDeletingProviderId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const t = COPY[locale];

  const loadProviders = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/ai-providers');
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message =
          typeof payload.error === 'string' && payload.error.trim() ? payload.error : t.loadError;
        throw new Error(message);
      }

      const payload = await response.json();
      const nextProviders = Array.isArray(payload.providers) ? (payload.providers as AiProviderSummary[]) : [];
      setProviders(nextProviders);
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
    void loadProviders();
  }, [loadProviders]);

  const changeLocale = (nextLocale: AppLocale) => {
    setLocale(nextLocale);
    setCompatStorageItem(localStorage, LOCALE_STORAGE_KEY, nextLocale, LEGACY_LOCALE_STORAGE_KEYS);
    document.cookie = `app_locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
  };

  const handleInputChange = (providerId: string, value: string) => {
    setInputByProviderId((previous) => ({
      ...previous,
      [providerId]: value,
    }));
  };

  const handleSaveProvider = async (providerId: string) => {
    const apiKey = inputByProviderId[providerId]?.trim() ?? '';
    if (!apiKey) return;

    setSavingProviderId(providerId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/ai-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, apiKey }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message =
          typeof payload.error === 'string' && payload.error.trim() ? payload.error : t.saveError;
        throw new Error(message);
      }

      const payload = await response.json();
      const savedProvider = payload.provider as AiProviderSummary | undefined;
      if (savedProvider) {
        setProviders((previous) =>
          previous.map((provider) => (provider.id === savedProvider.id ? savedProvider : provider))
        );
      }
      setInputByProviderId((previous) => ({
        ...previous,
        [providerId]: '',
      }));
      setSuccess(t.saved);
      setTimeout(() => setSuccess(''), 3000);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t.saveError);
      console.error(saveError);
    } finally {
      setSavingProviderId(null);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    setDeletingProviderId(providerId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/ai-providers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message =
          typeof payload.error === 'string' && payload.error.trim() ? payload.error : t.deleteError;
        throw new Error(message);
      }

      const payload = await response.json();
      const deletedProvider = payload.provider as AiProviderSummary | undefined;
      if (deletedProvider) {
        setProviders((previous) =>
          previous.map((provider) => (provider.id === deletedProvider.id ? deletedProvider : provider))
        );
      }
      setInputByProviderId((previous) => ({
        ...previous,
        [providerId]: '',
      }));
      setSuccess(t.deleted);
      setTimeout(() => setSuccess(''), 3000);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t.deleteError);
      console.error(deleteError);
    } finally {
      setDeletingProviderId(null);
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
          <section className="min-w-0 space-y-6">

          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{t.sectionTitle}</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{t.sectionHint}</p>
              </div>
              <button
                type="button"
                onClick={() => void loadProviders()}
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
            ) : providers.length === 0 ? (
              <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">{t.emptyState}</p>
            ) : (
              <div className="mt-6 space-y-4">
                {providers.map((provider) => {
                  const providerLabel = provider.label[locale] ?? provider.label.es ?? provider.id;
                  const statusLabel =
                    provider.configuredVia === 'admin'
                      ? t.configuredInAdmin
                      : provider.configuredVia === 'env'
                        ? t.configuredViaEnv
                        : t.notConfigured;

                  return (
                    <article
                      key={provider.id}
                      className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <h3 className="text-base font-semibold">{providerLabel}</h3>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">{statusLabel}</p>
                          {provider.hasStoredSecret ? (
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">
                              {t.savedKeyAvailable}
                            </p>
                          ) : null}
                          {provider.updatedAt ? (
                            <p className="text-xs text-zinc-500 dark:text-zinc-500">
                              {t.lastUpdated}: {formatUpdatedAt(provider.updatedAt, locale)}
                            </p>
                          ) : null}
                        </div>
                        <div className="w-full max-w-xl space-y-3">
                          <label
                            htmlFor={`provider-key-${provider.id}`}
                            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                          >
                            {t.inputLabel}
                          </label>
                          <input
                            id={`provider-key-${provider.id}`}
                            data-testid={`provider-key-input-${provider.id}`}
                            type="password"
                            autoComplete="off"
                            value={inputByProviderId[provider.id] ?? ''}
                            onChange={(event) => handleInputChange(provider.id, event.target.value)}
                            placeholder={t.inputPlaceholder}
                            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              data-testid={`save-provider-${provider.id}`}
                              onClick={() => void handleSaveProvider(provider.id)}
                              disabled={
                                savingProviderId === provider.id ||
                                deletingProviderId === provider.id ||
                                !(inputByProviderId[provider.id]?.trim())
                              }
                              className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                            >
                              <Save className="h-4 w-4" />
                              {savingProviderId === provider.id ? `${t.saveKey}...` : t.saveKey}
                            </button>
                            {provider.hasStoredSecret ? (
                              <button
                                type="button"
                                data-testid={`delete-provider-${provider.id}`}
                                onClick={() => void handleDeleteProvider(provider.id)}
                                disabled={savingProviderId === provider.id || deletingProviderId === provider.id}
                                className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                              >
                                <Trash2 className="h-4 w-4" />
                                {deletingProviderId === provider.id ? `${t.deleteKey}...` : t.deleteKey}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
          </section>
        </div>
      </div>
    </main>
  );
}
