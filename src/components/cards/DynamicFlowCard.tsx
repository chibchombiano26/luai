'use client';

import { AppLocale } from '@/lib/i18n';

interface DynamicFlowCardProps {
  title: string;
  description?: string;
  message?: string;
  details?: Array<{
    label: string;
    value: string;
  }>;
  locale: AppLocale;
}

export function DynamicFlowCard({
  title,
  description,
  message,
  details,
  locale,
}: DynamicFlowCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 space-y-3">
      <div>
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
        ) : null}
      </div>

      <p className="text-sm text-zinc-700 dark:text-zinc-300">
        {message ?? (locale === 'es' ? 'Sin resumen disponible.' : 'No summary available.')}
      </p>

      {details && details.length > 0 ? (
        <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3">
          <dl className="space-y-2">
            {details.map((detail, index) => (
              <div key={`${detail.label}-${index}`} className="flex items-start justify-between gap-3">
                <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{detail.label}</dt>
                <dd className="text-xs text-right text-zinc-700 dark:text-zinc-200 break-all">
                  {detail.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </div>
  );
}
