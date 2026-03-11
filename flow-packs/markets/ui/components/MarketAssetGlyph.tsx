'use client';

import {
  Bitcoin,
  Circle,
  Coins,
  Gem,
  Hexagon,
  LucideIcon,
} from 'lucide-react';

const ICON_BY_SYMBOL: Record<string, LucideIcon> = {
  XAU: Coins,
  XAG: Circle,
  XPT: Gem,
  XPD: Hexagon,
  HG: Circle,
  BTC: Bitcoin,
  ETH: Hexagon,
};

export function getMarketAssetTone(symbol: string): {
  orbClassName: string;
  iconClassName: string;
  badgeClassName: string;
} {
  switch (symbol) {
    case 'XAU':
      return {
        orbClassName:
          'bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.95),_rgba(180,83,9,0.82))] shadow-[0_14px_32px_-14px_rgba(180,83,9,0.9)]',
        iconClassName: 'text-amber-950',
        badgeClassName:
          'border-amber-300/70 bg-amber-100/90 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300',
      };
    case 'XAG':
      return {
        orbClassName:
          'bg-[radial-gradient(circle_at_top,_rgba(226,232,240,0.98),_rgba(100,116,139,0.86))] shadow-[0_14px_32px_-14px_rgba(71,85,105,0.8)]',
        iconClassName: 'text-slate-950',
        badgeClassName:
          'border-slate-300/70 bg-slate-100/90 text-slate-900 dark:border-slate-500/30 dark:bg-slate-500/15 dark:text-slate-200',
      };
    case 'BTC':
      return {
        orbClassName:
          'bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.98),_rgba(194,65,12,0.88))] shadow-[0_14px_32px_-14px_rgba(194,65,12,0.85)]',
        iconClassName: 'text-orange-950',
        badgeClassName:
          'border-orange-300/70 bg-orange-100/90 text-orange-900 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-300',
      };
    case 'ETH':
      return {
        orbClassName:
          'bg-[radial-gradient(circle_at_top,_rgba(216,180,254,0.96),_rgba(109,40,217,0.86))] shadow-[0_14px_32px_-14px_rgba(109,40,217,0.8)]',
        iconClassName: 'text-violet-950',
        badgeClassName:
          'border-violet-300/70 bg-violet-100/90 text-violet-900 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-300',
      };
    case 'HG':
      return {
        orbClassName:
          'bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.94),_rgba(154,52,18,0.88))] shadow-[0_14px_32px_-14px_rgba(154,52,18,0.8)]',
        iconClassName: 'text-rose-950',
        badgeClassName:
          'border-rose-300/70 bg-rose-100/90 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300',
      };
    default:
      return {
        orbClassName:
          'bg-[radial-gradient(circle_at_top,_rgba(192,132,252,0.94),_rgba(30,41,59,0.88))] shadow-[0_14px_32px_-14px_rgba(30,41,59,0.8)]',
        iconClassName: 'text-white',
        badgeClassName:
          'border-zinc-300/70 bg-zinc-100/90 text-zinc-900 dark:border-zinc-500/30 dark:bg-zinc-500/15 dark:text-zinc-200',
      };
  }
}

export function MarketAssetGlyph({
  symbol,
  className = '',
  iconClassName = '',
}: {
  symbol: string;
  className?: string;
  iconClassName?: string;
}) {
  const Icon = ICON_BY_SYMBOL[symbol] ?? Coins;

  return <Icon className={className ? `${className} ${iconClassName}` : iconClassName} />;
}
