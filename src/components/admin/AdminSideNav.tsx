'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, Database, Package, Settings, Users } from 'lucide-react';
import type { AppLocale } from '@/lib/i18n';
import { GENERATED_FLOW_PACK_UI_MODULES } from '@/lib/platform/generated-flow-pack-ui';
import { getFlowPackAdminPageRegistrations } from '@/lib/platform/pack-ui';

type AdminSectionItem = {
  id: string;
  href: string;
  icon: typeof Settings;
  labels: {
    es: string;
    en: string;
  };
};

const ADMIN_SECTION_ITEMS: readonly AdminSectionItem[] = [
  {
    id: 'configuration',
    href: '/admin',
    icon: Settings,
    labels: {
      es: 'Configuración',
      en: 'Configuration',
    },
  },
  {
    id: 'ai-providers',
    href: '/admin/ai-providers',
    icon: Bot,
    labels: {
      es: 'Proveedores AI',
      en: 'AI Providers',
    },
  },
  {
    id: 'database-provider',
    href: '/admin/database-provider',
    icon: Database,
    labels: {
      es: 'Base de Datos',
      en: 'Database',
    },
  },
  {
    id: 'users',
    href: '/admin/users',
    icon: Users,
    labels: {
      es: 'Usuarios',
      en: 'Users',
    },
  },
] as const;

const ADMIN_EXTENSION_ICONS = {
  package: Package,
  settings: Settings,
  bot: Bot,
  database: Database,
  users: Users,
} as const;

function isItemActive(pathname: string | null, href: AdminSectionItem['href']): boolean {
  if (!pathname) return false;
  if (href === '/admin') {
    return pathname === '/admin';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSideNav({ locale }: { locale: AppLocale }) {
  const pathname = usePathname();
  const injectedItems: AdminSectionItem[] = getFlowPackAdminPageRegistrations(
    GENERATED_FLOW_PACK_UI_MODULES
  ).map((registration) => ({
    id: `flow-pack:${registration.id}`,
    href: `/admin/modules/${registration.slug}`,
    icon:
      ADMIN_EXTENSION_ICONS[
        (registration.iconKey ?? 'package') as keyof typeof ADMIN_EXTENSION_ICONS
      ] ?? Package,
    labels: registration.navLabelByLocale,
  }));
  const sectionItems = [...ADMIN_SECTION_ITEMS, ...injectedItems];

  return (
    <nav className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2">
      <ul className="space-y-1">
        {sectionItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(pathname, item.href);

          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.labels[locale]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
