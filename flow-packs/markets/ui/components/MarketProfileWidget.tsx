'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { AppLocale } from '@/lib/i18n';
import { buildMarketAssetPagePath } from '@packs/markets/shared/routes';

type AssetDefinition = {
  symbol: string;
  name: string;
};

type PreferencesPayload = {
  preferences: {
    defaultSymbol: string;
    favoriteSymbols: string[];
    compactView: boolean;
  };
  settings: {
    defaultSymbol: string;
    featuredSymbols: string[];
  };
  assets: AssetDefinition[];
};

const COPY = {
  es: {
    title: 'Opciones de mercados',
    subtitle:
      'Personaliza tu activo inicial, los favoritos del widget y la densidad de la vista.',
    loading: 'Cargando opciones de mercados...',
    save: 'Guardar opciones',
    saving: 'Guardando...',
    success: 'Opciones guardadas.',
    error: 'No se pudieron guardar las opciones.',
    defaultSymbol: 'Activo inicial',
    favorites: 'Favoritos',
    compactView: 'Vista compacta en el widget',
    quickLinks: 'Mis accesos rapidos',
  },
  en: {
    title: 'Market options',
    subtitle:
      'Customize your default asset, widget favorites, and the density of the view.',
    loading: 'Loading market options...',
    save: 'Save options',
    saving: 'Saving...',
    success: 'Options saved.',
    error: 'Could not save options.',
    defaultSymbol: 'Default asset',
    favorites: 'Favorites',
    compactView: 'Compact widget view',
    quickLinks: 'My quick links',
  },
} as const;

export function MarketProfileWidget({ locale }: { locale: AppLocale }) {
  const t = COPY[locale];
  const [assets, setAssets] = useState<AssetDefinition[]>([]);
  const [preferences, setPreferences] = useState<PreferencesPayload['preferences'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/flow/markets/preferences', {
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('load-market-preferences');
        }

        const payload = (await response.json()) as PreferencesPayload;
        if (cancelled) return;

        setAssets(payload.assets);
        setPreferences(payload.preferences);
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

  if (isLoading || !preferences) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        {t.loading}
      </div>
    );
  }

  const toggleFavorite = (symbol: string) => {
    setPreferences((current) => {
      if (!current) return current;

      const exists = current.favoriteSymbols.includes(symbol);
      const favoriteSymbols = exists
        ? current.favoriteSymbols.filter((candidate) => candidate !== symbol)
        : [...current.favoriteSymbols, symbol].slice(0, 10);

      return {
        ...current,
        favoriteSymbols: favoriteSymbols.length > 0 ? favoriteSymbols : [current.defaultSymbol],
      };
    });
  };

  const handleSave = async () => {
    if (!preferences) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/flow/markets/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(preferences),
      });
      const payload = (await response.json()) as {
        preferences?: PreferencesPayload['preferences'];
        error?: string;
      };

      if (!response.ok || !payload.preferences) {
        throw new Error(payload.error ?? t.error);
      }

      setPreferences(payload.preferences);
      setSuccess(t.success);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t.error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">{t.title}</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{t.subtitle}</p>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
          {success}
        </div>
      ) : null}

      <div className="mt-5 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {t.defaultSymbol}
            <select
              value={preferences.defaultSymbol}
              onChange={(event) =>
                setPreferences((current) =>
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

          <label className="mt-5 flex items-start gap-3 rounded-2xl border border-zinc-200 px-4 py-4 text-sm text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={preferences.compactView}
              onChange={(event) =>
                setPreferences((current) =>
                  current
                    ? {
                        ...current,
                        compactView: event.target.checked,
                      }
                    : current
                )
              }
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-blue-600"
            />
            <span>{t.compactView}</span>
          </label>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="mt-5 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? t.saving : t.save}
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">{t.favorites}</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {assets.map((asset) => {
                const active = preferences.favoriteSymbols.includes(asset.symbol);

                return (
                  <button
                    key={asset.symbol}
                    type="button"
                    onClick={() => toggleFavorite(asset.symbol)}
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

          <div>
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              {t.quickLinks}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {preferences.favoriteSymbols.map((symbol) => (
                <Link
                  key={symbol}
                  href={buildMarketAssetPagePath(symbol)}
                  className="rounded-full border border-zinc-200 px-3 py-2 text-xs text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-950"
                >
                  {symbol}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
