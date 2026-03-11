'use client';

import Link from 'next/link';
import { startTransition, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AppLocale } from '@/lib/i18n';
import { buildMarketAssetPagePath } from '@packs/markets/shared/routes';
import { MarketAssetCard, type MarketAssetCardData } from './MarketAssetCard';

interface AssetListPayload {
  assets: Array<{ symbol: string; name: string }>;
  settings: {
    defaultSymbol: string;
    featuredSymbols: string[];
    refreshIntervalSeconds: number;
    showCryptoAssets: boolean;
  };
}

interface AssetDetailPayload {
  asset: MarketAssetCardData;
  compare: MarketAssetCardData[];
  settings: AssetListPayload['settings'];
}

const COPY = {
  es: {
    eyebrow: 'Mercados publicos',
    title: 'Explorador de activos',
    subtitle:
      'Consulta un activo especifico del mercado con datos publicos de Gold-API y comparte el enlace del activo.',
    selectLabel: 'Activo',
    refresh: 'Actualizar',
    loading: 'Cargando activo...',
    compareTitle: 'Comparaciones rapidas',
    supportedTitle: 'Activos destacados',
    openAsset: 'Abrir activo',
    noCompare: 'No hay comparaciones configuradas.',
    updatedEvery: 'Actualizacion automatica cada',
    seconds: 'segundos',
    error: 'No se pudo cargar el activo.',
  },
  en: {
    eyebrow: 'Public markets',
    title: 'Asset explorer',
    subtitle:
      'Check a specific market asset with public Gold-API data and share the direct asset page.',
    selectLabel: 'Asset',
    refresh: 'Refresh',
    loading: 'Loading asset...',
    compareTitle: 'Quick comparisons',
    supportedTitle: 'Featured assets',
    openAsset: 'Open asset',
    noCompare: 'No comparisons configured.',
    updatedEvery: 'Auto refresh every',
    seconds: 'seconds',
    error: 'Could not load the asset.',
  },
} as const;

export function PublicMarketAssetExplorer({
  locale,
  initialSymbol,
}: {
  locale: AppLocale;
  initialSymbol?: string;
}) {
  const router = useRouter();
  const t = COPY[locale];
  const [assets, setAssets] = useState<Array<{ symbol: string; name: string }>>([]);
  const [settings, setSettings] = useState<AssetListPayload['settings'] | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol?.toUpperCase() ?? '');
  const [detail, setDetail] = useState<AssetDetailPayload | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadAssets = async () => {
      try {
        setIsLoadingList(true);
        const response = await fetch('/api/flow/markets/assets', {
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('asset-list-failed');
        }

        const payload = (await response.json()) as AssetListPayload;
        if (cancelled) return;

        setAssets(payload.assets);
        setSettings(payload.settings);
        setSelectedSymbol((current) => current || payload.settings.defaultSymbol);
        setError(null);
      } catch {
        if (cancelled) return;
        setError(t.error);
      } finally {
        if (!cancelled) {
          setIsLoadingList(false);
        }
      }
    };

    void loadAssets();

    return () => {
      cancelled = true;
    };
  }, [t.error]);

  useEffect(() => {
    if (!selectedSymbol) return;

    let cancelled = false;

    const loadDetail = async () => {
      try {
        setIsLoadingDetail(true);
        const response = await fetch(
          `/api/flow/markets/assets/${encodeURIComponent(selectedSymbol)}`,
          {
            cache: 'no-store',
            headers: {
              Accept: 'application/json',
            },
          }
        );
        if (!response.ok) {
          throw new Error('asset-detail-failed');
        }

        const payload = (await response.json()) as AssetDetailPayload;
        if (cancelled) return;
        setDetail(payload);
        setSettings(payload.settings);
        setError(null);
      } catch {
        if (cancelled) return;
        setError(t.error);
      } finally {
        if (!cancelled) {
          setIsLoadingDetail(false);
        }
      }
    };

    void loadDetail();

    const intervalMs = (settings?.refreshIntervalSeconds ?? 30) * 1000;
    const intervalId = window.setInterval(() => {
      void loadDetail();
    }, intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [selectedSymbol, settings?.refreshIntervalSeconds, t.error, refreshNonce]);

  const handleSelectSymbol = (symbol: string) => {
    const normalized = symbol.trim().toUpperCase();
    if (!normalized) return;

    startTransition(() => {
      setSelectedSymbol(normalized);
      router.replace(buildMarketAssetPagePath(normalized));
    });
  };

  const featuredAssets = settings?.featuredSymbols ?? [];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_32%),linear-gradient(180deg,_#fffdf7_0%,_#ffffff_48%,_#f8fafc_100%)] px-6 py-10 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-amber-200/70 bg-white/90 p-8 shadow-[0_24px_90px_-50px_rgba(180,83,9,0.55)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/85 dark:shadow-none">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-700 dark:text-amber-300">
            {t.eyebrow}
          </p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <h1 className="font-serif text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {t.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {t.subtitle}
              </p>
            </div>
            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
              <label className="block text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                {t.selectLabel}
                <select
                  value={selectedSymbol}
                  onChange={(event) => handleSelectSymbol(event.target.value)}
                  className="mt-3 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                >
                  {(assets.length > 0 ? assets : [{ symbol: selectedSymbol || 'XAU', name: selectedSymbol || 'XAU' }]).map(
                    (asset) => (
                      <option key={asset.symbol} value={asset.symbol}>
                        {asset.name} ({asset.symbol})
                      </option>
                    )
                  )}
                </select>
              </label>
              <button
                type="button"
                onClick={() => setRefreshNonce((current) => current + 1)}
                className="mt-4 w-full rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400"
              >
                {t.refresh}
              </button>
              {settings ? (
                <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                  {t.updatedEvery} {settings.refreshIntervalSeconds} {t.seconds}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        {error ? (
          <section className="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </section>
        ) : null}

        {isLoadingList || isLoadingDetail ? (
          <section className="rounded-3xl border border-zinc-200 bg-white px-6 py-10 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            {t.loading}
          </section>
        ) : null}

        {detail ? (
          <>
            <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <MarketAssetCard asset={detail.asset} locale={locale} />

              <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400">
                  {t.supportedTitle}
                </p>
                <div className="mt-4 space-y-3">
                  {featuredAssets.map((symbol) => {
                    const href = buildMarketAssetPagePath(symbol);

                    return (
                      <Link
                        key={symbol}
                        href={href}
                        className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${
                          symbol === detail.asset.symbol
                            ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/60 dark:bg-amber-500/10 dark:text-amber-300'
                            : 'border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-950'
                        }`}
                      >
                        <span>{symbol}</span>
                        <span>{t.openAsset}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
                  {t.compareTitle}
                </h2>
              </div>
              {detail.compare.length === 0 ? (
                <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">{t.noCompare}</p>
              ) : (
                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {detail.compare.map((asset) => (
                    <MarketAssetCard
                      key={asset.symbol}
                      asset={asset}
                      locale={locale}
                      href={buildMarketAssetPagePath(asset.symbol)}
                      compact
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}
