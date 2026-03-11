'use client';

import { useEffect, useState } from 'react';
import type { AppLocale } from '@/lib/i18n';

type MarketSettings = {
  defaultSymbol: string;
  featuredSymbols: string[];
  refreshIntervalSeconds: number;
  showCryptoAssets: boolean;
};

type AssetDefinition = {
  symbol: string;
  name: string;
};

const COPY = {
  es: {
    introTitle: 'Configuracion del modulo de mercados',
    introBody:
      'Define el activo por defecto, los destacados visibles en la pagina publica y el ritmo de refresco.',
    loading: 'Cargando configuracion...',
    save: 'Guardar configuracion',
    saving: 'Guardando...',
    success: 'Configuracion guardada.',
    error: 'No se pudo guardar la configuracion.',
    defaultSymbol: 'Activo por defecto',
    featuredSymbols: 'Activos destacados',
    refreshInterval: 'Refresco automatico (segundos)',
    showCrypto: 'Mostrar criptoactivos en explorador y perfil',
  },
  en: {
    introTitle: 'Market module settings',
    introBody:
      'Set the default asset, featured public page assets, and the automatic refresh cadence.',
    loading: 'Loading settings...',
    save: 'Save settings',
    saving: 'Saving...',
    success: 'Settings saved.',
    error: 'Could not save settings.',
    defaultSymbol: 'Default asset',
    featuredSymbols: 'Featured assets',
    refreshInterval: 'Auto refresh (seconds)',
    showCrypto: 'Show crypto assets in explorer and profile',
  },
} as const;

export function MarketAdminPanel({ locale }: { locale: AppLocale }) {
  const t = COPY[locale];
  const [assets, setAssets] = useState<AssetDefinition[]>([]);
  const [settings, setSettings] = useState<MarketSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/flow/markets/admin/settings', {
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('load-market-admin-settings');
        }

        const payload = (await response.json()) as {
          settings: MarketSettings;
          assets: AssetDefinition[];
        };
        if (cancelled) return;

        setAssets(payload.assets);
        setSettings(payload.settings);
        setError(null);
      } catch {
        if (cancelled) return;
        setError(t.error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [t.error]);

  if (isLoading || !settings) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        {t.loading}
      </div>
    );
  }

  const toggleFeatured = (symbol: string) => {
    setSettings((current) => {
      if (!current) return current;

      const exists = current.featuredSymbols.includes(symbol);
      const nextFeatured = exists
        ? current.featuredSymbols.filter((candidate) => candidate !== symbol)
        : [...current.featuredSymbols, symbol].slice(0, 8);

      return {
        ...current,
        featuredSymbols: nextFeatured.length > 0 ? nextFeatured : [current.defaultSymbol],
      };
    });
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/flow/markets/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(settings),
      });
      const payload = (await response.json()) as {
        settings?: MarketSettings;
        error?: string;
      };

      if (!response.ok || !payload.settings) {
        throw new Error(payload.error ?? t.error);
      }

      setSettings(payload.settings);
      setSuccess(t.success);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t.error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">{t.introTitle}</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{t.introBody}</p>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
          {success}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {t.defaultSymbol}
            <select
              value={settings.defaultSymbol}
              onChange={(event) =>
                setSettings((current) =>
                  current
                    ? {
                        ...current,
                        defaultSymbol: event.target.value,
                      }
                    : current
                )
              }
              className="mt-3 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            >
              {assets.map((asset) => (
                <option key={asset.symbol} value={asset.symbol}>
                  {asset.name} ({asset.symbol})
                </option>
              ))}
            </select>
          </label>

          <label className="mt-5 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {t.refreshInterval}
            <input
              type="number"
              min={10}
              max={300}
              value={settings.refreshIntervalSeconds}
              onChange={(event) =>
                setSettings((current) =>
                  current
                    ? {
                        ...current,
                        refreshIntervalSeconds: Number(event.target.value) || 30,
                      }
                    : current
                )
              }
              className="mt-3 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>

          <label className="mt-5 flex items-start gap-3 rounded-2xl border border-zinc-200 px-4 py-4 text-sm text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={settings.showCryptoAssets}
              onChange={(event) =>
                setSettings((current) =>
                  current
                    ? {
                        ...current,
                        showCryptoAssets: event.target.checked,
                      }
                    : current
                )
              }
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-blue-600"
            />
            <span>{t.showCrypto}</span>
          </label>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="mt-6 w-full rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-blue-600 dark:hover:bg-blue-500"
          >
            {isSaving ? t.saving : t.save}
          </button>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
            {t.featuredSymbols}
          </h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {assets.map((asset) => {
              const active = settings.featuredSymbols.includes(asset.symbol);

              return (
                <button
                  key={asset.symbol}
                  type="button"
                  onClick={() => toggleFeatured(asset.symbol)}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    active
                      ? 'border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-500/60 dark:bg-blue-500/10 dark:text-blue-300'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-950/80'
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]">
                    {asset.symbol}
                  </p>
                  <p className="mt-2 text-sm font-medium">{asset.name}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
