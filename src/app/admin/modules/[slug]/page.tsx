'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSideNav } from '@/components/admin/AdminSideNav';
import { useAdminLocale } from '@/components/admin/useAdminLocale';
import { GENERATED_FLOW_PACK_UI_MODULES } from '@/lib/platform/generated-flow-pack-ui';
import {
  getFlowPackAdminPageRegistrations,
  resolveFlowPackAdminPage,
} from '@/lib/platform/pack-ui';

const FALLBACK_COPY = {
  es: {
    title: 'Módulo no disponible',
    subtitle: 'El módulo solicitado no está registrado en los packs activos.',
    backToChat: 'Volver al chat',
  },
  en: {
    title: 'Module not available',
    subtitle: 'The requested module is not registered in the active packs.',
    backToChat: 'Back to chat',
  },
} as const;

export default function AdminPackModulePage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const { locale, changeLocale } = useAdminLocale();

  const registrations = useMemo(
    () => getFlowPackAdminPageRegistrations(GENERATED_FLOW_PACK_UI_MODULES),
    []
  );
  const registration = useMemo(
    () => resolveFlowPackAdminPage(registrations, slug),
    [registrations, slug]
  );
  const fallback = FALLBACK_COPY[locale];

  const title = registration?.titleByLocale[locale] ?? fallback.title;
  const subtitle = registration?.subtitleByLocale?.[locale] ?? fallback.subtitle;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AdminPageHeader
        locale={locale}
        title={title}
        subtitle={subtitle}
        backLabel={fallback.backToChat}
        onChangeLocale={changeLocale}
      />
      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-6">
        <aside className="w-full max-w-[220px] shrink-0">
          <AdminSideNav locale={locale} />
        </aside>
        <section className="flex-1 min-w-0">
          {registration ? (
            <registration.Component locale={locale} />
          ) : (
            <div className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              {fallback.subtitle}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
