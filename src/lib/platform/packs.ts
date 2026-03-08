import { GENERATED_FLOW_PACKS } from './generated-flow-packs';
import type { AppLocale } from '@/lib/i18n';

export interface FlowPackAdminProviderOption {
  id: string;
  label: {
    es: string;
    en: string;
  };
  endpointKey?: string;
}

export interface FlowPackAdminCardOption {
  configPlaceholder?: {
    es: string;
    en: string;
  };
  providerOptions?: FlowPackAdminProviderOption[];
}

interface FlowPackDefinition {
  id: string;
  admin?: {
    cardOptions?: Record<string, FlowPackAdminCardOption>;
  };
}

const FLOW_PACKS = GENERATED_FLOW_PACKS as unknown as readonly FlowPackDefinition[];

export function getAdminCardOption(cardId: string): FlowPackAdminCardOption | null {
  for (const pack of FLOW_PACKS) {
    const cardOption = pack.admin?.cardOptions?.[cardId];
    if (cardOption) {
      return cardOption;
    }
  }

  return null;
}

export function getAdminCardConfigPlaceholder(cardId: string, locale: AppLocale): string {
  return getAdminCardOption(cardId)?.configPlaceholder?.[locale] ?? '';
}

export function getAdminProviderOptionsForCard(cardId: string): FlowPackAdminProviderOption[] {
  return getAdminCardOption(cardId)?.providerOptions ?? [];
}
