'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Clock3 } from 'lucide-react';
import type { FlowPackToolRendererProps } from '@/lib/platform/pack-ui';
import { MarketAssetGlyph, getMarketAssetTone } from './MarketAssetGlyph';

function getDetailValue(
  details: Array<{ label: string; value: string }> | undefined,
  labels: readonly string[]
): string | null {
  const entry = details?.find((detail) => labels.includes(detail.label));
  return entry?.value ?? null;
}

function splitAssetLabel(value: string | null): { name: string; symbol: string } {
  const normalized = value?.trim() ?? '';
  const match = /(.*)\(([^)]+)\)\s*$/.exec(normalized);
  if (!match) {
    return {
      name: normalized || 'Asset',
      symbol: 'XAU',
    };
  }

  return {
    name: match[1].trim(),
    symbol: match[2].trim().toUpperCase(),
  };
}

function splitPriceLabel(value: string | null): { amount: string; unit: string | null } {
  const normalized = value?.replace(/\s+/g, ' ').trim() ?? '';
  if (!normalized) {
    return {
      amount: '--',
      unit: null,
    };
  }

  const match = /^(.*?)(\s(?:usd|eur|cop)\b.*)$/i.exec(normalized);
  if (match) {
    return {
      amount: match[1].trim(),
      unit: match[2].trim(),
    };
  }

  return {
    amount: normalized,
    unit: null,
  };
}

export function MarketAssetResultCard({
  toolMessage,
  locale,
}: FlowPackToolRendererProps) {
  if (toolMessage.type !== 'dynamic_card' || toolMessage.data.cardId !== 'market_asset_lookup') {
    return null;
  }

  const details = Array.isArray(toolMessage.data.details) ? toolMessage.data.details : [];
  const assetLabel = getDetailValue(details, ['Activo', 'Asset']);
  const priceLabel = getDetailValue(details, ['Precio', 'Price']);
  const updatedLabel = getDetailValue(details, ['Actualizado', 'Updated']);
  const compareLabel = getDetailValue(details, ['Comparar con', 'Compare with']);
  const publicPage = getDetailValue(details, ['Pagina publica', 'Public page']);
  const { name, symbol } = splitAssetLabel(assetLabel);
  const { amount: priceAmount, unit: priceUnit } = splitPriceLabel(priceLabel);
  const tone = getMarketAssetTone(symbol);
  const compareSymbols = compareLabel
    ? compareLabel
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[28px] border border-zinc-200 bg-[linear-gradient(135deg,_rgba(255,255,255,0.98)_0%,_rgba(250,250,249,0.98)_45%,_rgba(245,245,244,0.98)_100%)] shadow-[0_28px_80px_-45px_rgba(24,24,27,0.45)] dark:border-zinc-800 dark:bg-[linear-gradient(135deg,_rgba(24,24,27,0.98)_0%,_rgba(15,23,42,0.96)_100%)] dark:shadow-none"
    >
      <div className="relative p-5">
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.22),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_42%)]" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] ${tone.orbClassName}`}
            >
              <MarketAssetGlyph symbol={symbol} className="h-8 w-8" iconClassName={tone.iconClassName} />
            </div>

            <div className="min-w-0">
              <div
                className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] ${tone.badgeClassName}`}
              >
                {symbol}
              </div>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {name}
              </h3>
              {toolMessage.data.description ? (
                <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  {toolMessage.data.description}
                </p>
              ) : null}
            </div>
          </div>

          {publicPage ? (
            <Link
              href={publicPage}
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-2xl border border-zinc-200 bg-white/90 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              {locale === 'es' ? 'Ver activo' : 'Open asset'}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>

        <div className="relative mt-5 space-y-3">
          <div className="rounded-[24px] border border-zinc-200/90 bg-white/95 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                    {locale === 'es' ? 'Cotizacion actual' : 'Current quote'}
                  </p>
                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:border-emerald-900/80 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {locale === 'es' ? 'En vivo' : 'Live'}
                  </span>
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  <p className="text-[2rem] font-semibold leading-none tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-[2.4rem]">
                    {priceAmount}
                  </p>
                  {priceUnit ? (
                    <span className="inline-flex w-fit items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                      {priceUnit}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 lg:w-[280px] lg:grid-cols-1">
                <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-900/70">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                    {locale === 'es' ? 'Activo' : 'Asset'}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    <MarketAssetGlyph
                      symbol={symbol}
                      className="h-4 w-4"
                      iconClassName={tone.iconClassName}
                    />
                    <span>{symbol}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-900/70">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                    Source
                  </p>
                  <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Gold-API
                  </p>
                </div>
              </div>
            </div>

            {toolMessage.data.message ? (
              <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {toolMessage.data.message}
              </p>
            ) : null}
          </div>

          <div className="rounded-[24px] border border-zinc-200/90 bg-zinc-50/90 p-4 dark:border-zinc-800 dark:bg-zinc-950/80">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                  {locale === 'es' ? 'Snapshot' : 'Snapshot'}
                </p>
                {updatedLabel ? (
                  <div className="mt-3 flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                    <Clock3 className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                    <span>{updatedLabel}</span>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${tone.badgeClassName}`}
                >
                  <MarketAssetGlyph
                    symbol={symbol}
                    className="h-3.5 w-3.5"
                    iconClassName={tone.iconClassName}
                  />
                  {symbol}
                </span>
                <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                  Gold-API
                </span>
              </div>
            </div>

            {compareSymbols.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {compareSymbols.map((compareSymbol) => {
                  const compareTone = getMarketAssetTone(compareSymbol);

                  return (
                    <span
                      key={compareSymbol}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${compareTone.badgeClassName}`}
                    >
                      <MarketAssetGlyph
                        symbol={compareSymbol}
                        className="h-3.5 w-3.5"
                        iconClassName={compareTone.iconClassName}
                      />
                      {compareSymbol}
                    </span>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
