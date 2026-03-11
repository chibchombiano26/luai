'use client';

import { MarketAdminPanel } from './components/MarketAdminPanel';
import { MarketAssetResultCard } from './components/MarketAssetResultCard';
import { MarketProfileWidget } from './components/MarketProfileWidget';
import type { FlowPackUiModule } from '@/lib/platform/pack-ui';

export const renderers: FlowPackUiModule['renderers'] = [
  {
    toolType: 'dynamic_card',
    cardId: 'market_asset_lookup',
    titleByLocale: {
      es: 'Activo de mercado',
      en: 'Market asset',
    },
    Component: MarketAssetResultCard,
  },
];

export const adminPages: FlowPackUiModule['adminPages'] = [
  {
    id: 'markets-admin',
    slug: 'markets',
    iconKey: 'database',
    order: 40,
    navLabelByLocale: {
      es: 'Mercados',
      en: 'Markets',
    },
    titleByLocale: {
      es: 'Mercados',
      en: 'Markets',
    },
    subtitleByLocale: {
      es: 'Configura los activos destacados y el comportamiento de la pagina publica.',
      en: 'Configure featured assets and public page behavior.',
    },
    Component: ({ locale }) => <MarketAdminPanel locale={locale} />,
  },
];

export const profileWidgets: FlowPackUiModule['profileWidgets'] = [
  {
    id: 'market-preferences',
    order: 20,
    titleByLocale: {
      es: 'Opciones de mercados',
      en: 'Market options',
    },
    Component: ({ locale }) => <MarketProfileWidget locale={locale} />,
  },
];
