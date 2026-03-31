import {
  GENERATED_FLOW_CARD_DEFINITIONS,
  GENERATED_FLOW_CARD_IDS,
} from './generated-flow-packs';

export type FlowCardId = (typeof GENERATED_FLOW_CARD_IDS)[number];

/** Generated raw card definition inferred from the flow-pack registry output. */
export type GeneratedFlowCardDefinition = (typeof GENERATED_FLOW_CARD_DEFINITIONS)[number];

export interface FlowCardDefinition {
  id: FlowCardId;
  packId: string;
  kind: 'native' | 'langflow';
  adapter: string;
  order: number;
  category: string;
  name: {
    es: string;
    en: string;
  };
  description: {
    es: string;
    en: string;
  };
  defaultEnabled: boolean;
  replacePreviousByCardId?: boolean;
  toolId: string;
  supportedToolIds: readonly string[];
  langflowEndpoint?: string;
  homeExperiences?: readonly {
    id: string;
    kind?: 'wizard' | 'form';
    componentKey: string;
    storageAliases?: readonly string[];
    order?: number;
    label: {
      es: string;
      en: string;
    };
  }[];
}

export interface FlowCardSettings {
  enabledByCardId?: Record<string, boolean>;
  configByCardId?: Record<string, Record<string, unknown>>;
}

export interface FlowCardWithStatus extends FlowCardDefinition {
  enabled: boolean;
  config: Record<string, unknown>;
}

export const FLOW_CARD_DEFINITIONS: readonly FlowCardDefinition[] =
  GENERATED_FLOW_CARD_DEFINITIONS as unknown as readonly FlowCardDefinition[];

export const FLOW_CARD_IDS = [...GENERATED_FLOW_CARD_IDS] as FlowCardId[];

const FLOW_CARD_ID_SET = new Set<FlowCardId>(FLOW_CARD_IDS);

export function isFlowCardId(value: unknown): value is FlowCardId {
  return typeof value === 'string' && FLOW_CARD_ID_SET.has(value as FlowCardId);
}

export function getFlowCardDefinition(cardId: FlowCardId): FlowCardDefinition {
  const card = FLOW_CARD_DEFINITIONS.find((item) => item.id === cardId);
  if (!card) {
    throw new Error(`Unknown flow card id: ${cardId}`);
  }
  return card;
}

export function shouldReplacePreviousDynamicCard(cardId: string): boolean {
  if (!isFlowCardId(cardId)) {
    return false;
  }

  return Boolean(getFlowCardDefinition(cardId).replacePreviousByCardId);
}

export function resolveFlowCardStatus(settings: FlowCardSettings): FlowCardWithStatus[] {
  const enabledOverrides = settings.enabledByCardId ?? {};
  const configOverrides = settings.configByCardId ?? {};
  return FLOW_CARD_DEFINITIONS.map((card) => {
    const enabled =
      typeof enabledOverrides[card.id] === 'boolean'
        ? enabledOverrides[card.id]
        : card.defaultEnabled;
    const config =
      configOverrides[card.id] && typeof configOverrides[card.id] === 'object'
        ? configOverrides[card.id]
        : {};

    return {
      ...card,
      enabled,
      config,
    };
  });
}

export function toEnabledFlowCardIdSet(settings: FlowCardSettings): Set<FlowCardId> {
  const resolved = resolveFlowCardStatus(settings)
    .filter((card) => card.enabled)
    .map((card) => card.id);
  return new Set<FlowCardId>(resolved);
}

export function sanitizeFlowCardSettings(settings: unknown): FlowCardSettings {
  if (!settings || typeof settings !== 'object') {
    return { enabledByCardId: {}, configByCardId: {} };
  }

  const source = settings as { enabledByCardId?: unknown; configByCardId?: unknown };
  const enabledByCardId: Record<string, boolean> = {};
  const configByCardId: Record<string, Record<string, unknown>> = {};

  if (source.enabledByCardId && typeof source.enabledByCardId === 'object') {
    for (const [cardId, value] of Object.entries(source.enabledByCardId as Record<string, unknown>)) {
      if (!isFlowCardId(cardId)) continue;
      if (typeof value !== 'boolean') continue;
      enabledByCardId[cardId] = value;
    }
  }

  if (source.configByCardId && typeof source.configByCardId === 'object') {
    for (const [cardId, value] of Object.entries(source.configByCardId as Record<string, unknown>)) {
      if (!isFlowCardId(cardId)) continue;
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
      configByCardId[cardId] = value as Record<string, unknown>;
    }
  }

  return { enabledByCardId, configByCardId };
}

export function toFlowCardConfigById(
  settings: FlowCardSettings
): Record<FlowCardId, Record<string, unknown>> {
  const resolved = resolveFlowCardStatus(settings);
  const map = {} as Record<FlowCardId, Record<string, unknown>>;
  for (const card of resolved) {
    map[card.id] = card.config;
  }
  return map;
}

export type GeneratedCardDefinition = GeneratedFlowCardDefinition;
