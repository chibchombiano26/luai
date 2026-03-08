'use client';

import type { FlowPackUiModule } from '@/lib/platform/pack-ui';
import { TemplateCard } from './components/TemplateCard';

export const renderers: FlowPackUiModule['renderers'] = [
  {
    toolType: 'dynamic_card',
    cardId: 'template_card',
    titleByLocale: {
      es: 'Card de ejemplo',
      en: 'Example card',
    },
    Component: TemplateCard,
  },
];

