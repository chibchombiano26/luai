'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { BarChart3, Clock3, LayoutGrid, type LucideIcon, User } from 'lucide-react';
import type { AppLocale } from '@/lib/i18n';
import type { FlowPackProfileWidgetRegistration } from '@/lib/platform/pack-ui';
import type { ProfileUiSettings } from '@/lib/profile/types';

export const PROFILE_SECTION_IDS = {
  user: 'profile-user',
  usageSummary: 'profile-usage-summary',
  dailyUsage: 'profile-daily-usage',
  recentEvents: 'profile-recent-events',
} as const;

function normalizeSectionSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getProfileWidgetSectionId(widgetId: string): string {
  const normalized = normalizeSectionSlug(widgetId);
  return `profile-widget-${normalized || 'section'}`;
}

function humanizeWidgetId(widgetId: string): string {
  const normalized = widgetId
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) return 'Widget';

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function resolveWidgetLabel(
  widget: FlowPackProfileWidgetRegistration,
  locale: AppLocale
): string {
  return (
    widget.titleByLocale?.[locale] ??
    widget.titleByLocale?.es ??
    widget.titleByLocale?.en ??
    humanizeWidgetId(widget.id)
  );
}

type ProfileSectionItem = {
  id: string;
  href: string;
  icon: LucideIcon;
  label: string;
};

export function ProfileSideNav({
  locale,
  widgets,
  uiSettings,
}: {
  locale: AppLocale;
  widgets: readonly FlowPackProfileWidgetRegistration[];
  uiSettings?: ProfileUiSettings | null;
}) {
  const prefersReducedMotion = useReducedMotion();
  const copy = {
    user: locale === 'es' ? 'Usuario' : 'User',
    usageSummary: locale === 'es' ? 'Resumen de tokens' : 'Token summary',
    dailyUsage: locale === 'es' ? 'Ultimos 14 dias' : 'Last 14 days',
    recentEvents: locale === 'es' ? 'Eventos recientes' : 'Recent events',
  };

  const sectionItems: ProfileSectionItem[] = [
    {
      id: PROFILE_SECTION_IDS.user,
      href: `#${PROFILE_SECTION_IDS.user}`,
      icon: User,
      label: copy.user,
    },
    ...widgets.map((widget) => ({
      id: getProfileWidgetSectionId(widget.id),
      href: `#${getProfileWidgetSectionId(widget.id)}`,
      icon: LayoutGrid,
      label: resolveWidgetLabel(widget, locale),
    })),
    ...(uiSettings?.showUsageSummary === false
      ? []
      : [
          {
            id: PROFILE_SECTION_IDS.usageSummary,
            href: `#${PROFILE_SECTION_IDS.usageSummary}`,
            icon: BarChart3,
            label: copy.usageSummary,
          },
        ]),
    ...(uiSettings?.showDailyUsageChart === false
      ? []
      : [
          {
            id: PROFILE_SECTION_IDS.dailyUsage,
            href: `#${PROFILE_SECTION_IDS.dailyUsage}`,
            icon: Clock3,
            label: copy.dailyUsage,
          },
        ]),
    ...(uiSettings?.showRecentTokenEvents === false
      ? []
      : [
          {
            id: PROFILE_SECTION_IDS.recentEvents,
            href: `#${PROFILE_SECTION_IDS.recentEvents}`,
            icon: Clock3,
            label: copy.recentEvents,
          },
        ]),
  ];

  return (
    <nav className="rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900 lg:sticky lg:top-24">
      <ul className="space-y-1">
        {sectionItems.map((item) => {
          const Icon = item.icon;
          const targetId = item.href.slice(1);

          return (
            <li key={item.id}>
              <motion.a
                href={item.href}
                onClick={(event) => {
                  const target = document.getElementById(targetId);
                  if (!target) return;

                  event.preventDefault();
                  window.history.replaceState(null, '', item.href);
                  target.scrollIntoView({
                    behavior: prefersReducedMotion ? 'auto' : 'smooth',
                    block: 'start',
                  });
                }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                whileHover={prefersReducedMotion ? undefined : { x: 4 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </motion.a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
