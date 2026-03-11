'use client';

import { PokemonAdminPanel } from './components/PokemonAdminPanel';
import { PokemonProfileWidget } from './components/PokemonProfileWidget';
import type { FlowPackToolRendererProps, FlowPackUiModule } from '@/lib/platform/pack-ui';
import { PokemonLookupCard } from './components/PokemonLookupCard';

function PokemonRenderer({ toolMessage, locale, onRemove, onFormSubmit }: FlowPackToolRendererProps) {
  return (
    <PokemonLookupCard
      toolMessage={toolMessage}
      locale={locale}
      onRemove={onRemove}
      onFormSubmit={onFormSubmit}
    />
  );
}

export const renderers: FlowPackUiModule['renderers'] = [
  {
    toolType: 'dynamic_card',
    cardId: 'pokemon_lookup',
    titleByLocale: {
      es: 'Pokemon',
      en: 'Pokemon',
    },
    Component: PokemonRenderer,
  },
];

export const adminPages: FlowPackUiModule['adminPages'] = [
  {
    id: 'pokemon-admin',
    slug: 'pokemon',
    iconKey: 'bot',
    order: 50,
    navLabelByLocale: {
      es: 'Pokemon',
      en: 'Pokemon',
    },
    titleByLocale: {
      es: 'Pokemon',
      en: 'Pokemon',
    },
    subtitleByLocale: {
      es: 'Operacion del lookup, defaults y exposicion MCP.',
      en: 'Lookup operations, defaults, and MCP exposure.',
    },
    Component: ({ locale }) => <PokemonAdminPanel locale={locale} />,
  },
];

export const profileWidgets: FlowPackUiModule['profileWidgets'] = [
  {
    id: 'pokemon-preferences',
    order: 40,
    titleByLocale: {
      es: 'Preferencias de Pokemon',
      en: 'Pokemon preferences',
    },
    Component: ({ locale }) => <PokemonProfileWidget locale={locale} />,
  },
];
