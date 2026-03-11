'use client';

import Link from 'next/link';
import { AppLocale } from '@/lib/i18n';
import { MarketAssetGlyph, getMarketAssetTone } from './MarketAssetGlyph';

export interface MarketAssetCardData {
  symbol: string;
  name: string;
  price: number;
  updatedAt: string;
  updatedAtReadable: string;
  unitLabel: string;
}

function formatPrice(value: number, locale: AppLocale): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es-CO' : 'en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1000 ? 2 : 4,
  }).format(value);
}

function formatTimestamp(value: string, locale: AppLocale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale === 'es' ? 'es-CO' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function MarketAssetCard({
  asset,
  locale,
  href,
  compact = false,
}: {
  asset: MarketAssetCardData;
  locale: AppLocale;
  href?: string;
  compact?: boolean;
}) {
  const tone = getMarketAssetTone(asset.symbol);
  const content = (
    <article
      className={`overflow-hidden rounded-[28px] border border-zinc-200 bg-[linear-gradient(145deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))] p-4 shadow-[0_24px_70px_-45px_rgba(24,24,27,0.45)] transition-transform duration-200 hover:-translate-y-0.5 dark:border-zinc-800 dark:bg-[linear-gradient(145deg,_rgba(24,24,27,0.98),_rgba(15,23,42,0.98))] dark:shadow-none ${
        compact ? 'space-y-2' : 'space-y-3'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] ${tone.orbClassName}`}
          >
            <MarketAssetGlyph
              symbol={asset.symbol}
              className="h-6 w-6"
              iconClassName={tone.iconClassName}
            />
          </div>
          <div>
            <p
              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${tone.badgeClassName}`}
            >
              {asset.symbol}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              {asset.name}
            </h3>
          </div>
        </div>
        <div className="rounded-full bg-zinc-950 px-3 py-1 text-[11px] font-medium text-white dark:bg-zinc-100 dark:text-zinc-950">
          Spot
        </div>
      </div>

      <div className="rounded-[22px] border border-zinc-200/80 bg-white/90 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
        <p className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          {formatPrice(asset.price, locale)}
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{asset.unitLabel}</p>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        <span>{asset.updatedAtReadable}</span>
        <span>{formatTimestamp(asset.updatedAt, locale)}</span>
      </div>
    </article>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}
