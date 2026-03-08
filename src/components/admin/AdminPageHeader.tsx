'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import type { AppLocale } from '@/lib/i18n';

type AdminPageHeaderProps = {
  locale: AppLocale;
  title: string;
  subtitle: string;
  backLabel: string;
  onChangeLocale: (locale: AppLocale) => void;
};

export function AdminPageHeader({
  locale,
  title,
  subtitle,
  backLabel,
  onChangeLocale,
}: AdminPageHeaderProps) {
  return (
    <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title={backLabel}
            aria-label={backLabel}
          >
            <ChevronLeft className="h-5 w-5 dark:text-zinc-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold dark:text-white">{title}</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-zinc-300 p-1 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => onChangeLocale('es')}
            className={`rounded px-2 py-1 text-xs ${
              locale === 'es'
                ? 'bg-blue-600 text-white'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            ES
          </button>
          <button
            type="button"
            onClick={() => onChangeLocale('en')}
            className={`rounded px-2 py-1 text-xs ${
              locale === 'en'
                ? 'bg-blue-600 text-white'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            EN
          </button>
        </div>
      </div>
    </div>
  );
}
