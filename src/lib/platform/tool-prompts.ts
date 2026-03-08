import type { FlowCardId } from './cards';
import { GENERATED_FLOW_TOOL_IDS_BY_CARD } from './generated-flow-packs';

export const TOOL_PROMPT_MAX_LENGTH = 320;

export const FLOW_TOOL_IDS_BY_CARD =
  GENERATED_FLOW_TOOL_IDS_BY_CARD as Record<FlowCardId, readonly string[]>;

/** Generated mapping between a flow card and the tool ids it can customize. */
export type FlowToolIdsByCard = typeof GENERATED_FLOW_TOOL_IDS_BY_CARD;
export type FlowToolId = FlowToolIdsByCard[keyof FlowToolIdsByCard][number];
export type LocalizedToolPrompt = Record<string, string>;

const FLOW_TOOL_ID_SET = new Set<FlowToolId>(
  Object.values(FLOW_TOOL_IDS_BY_CARD).flat() as FlowToolId[]
);

export function isFlowToolId(value: unknown): value is FlowToolId {
  return typeof value === 'string' && FLOW_TOOL_ID_SET.has(value as FlowToolId);
}

export function getToolIdsForCard(cardId: FlowCardId): FlowToolId[] {
  return Array.from(FLOW_TOOL_IDS_BY_CARD[cardId] ?? []) as FlowToolId[];
}

export function sanitizeToolPromptValue(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.slice(0, TOOL_PROMPT_MAX_LENGTH);
}

function normalizeLocaleKey(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return normalized;
}

function localeCandidates(locale: string): string[] {
  const normalized = normalizeLocaleKey(locale) ?? 'es';
  const base = normalized.split('-')[0] ?? normalized;
  return Array.from(new Set([normalized, base, 'en', 'es']));
}

export function resolveLocalizedToolPrompt(value: unknown): LocalizedToolPrompt {
  const legacyPrompt = sanitizeToolPromptValue(value);
  if (legacyPrompt) {
    return {
      es: legacyPrompt,
      en: legacyPrompt,
    };
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  const raw = value as Record<string, unknown>;
  const result: LocalizedToolPrompt = {};
  for (const [localeKey, localeValue] of Object.entries(raw)) {
    const normalizedKey = normalizeLocaleKey(localeKey);
    const normalizedValue = sanitizeToolPromptValue(localeValue);
    if (!normalizedKey || !normalizedValue) continue;
    result[normalizedKey] = normalizedValue;
  }

  return result;
}

export function resolveToolPromptForLocale(value: unknown, locale: string): string | null {
  const localized = resolveLocalizedToolPrompt(value);
  for (const candidate of localeCandidates(locale)) {
    const prompt = localized[candidate];
    if (typeof prompt === 'string' && prompt.trim()) return prompt;
  }
  const firstPrompt = Object.values(localized).find(
    (prompt): prompt is string => typeof prompt === 'string' && prompt.trim().length > 0
  );
  return firstPrompt ?? null;
}

export function getToolPromptsByLocaleForCard(
  cardId: FlowCardId,
  cardConfig: Record<string, unknown> | undefined
): Partial<Record<FlowToolId, LocalizedToolPrompt>> {
  const rawToolPrompts = cardConfig?.toolPrompts;
  if (!rawToolPrompts || typeof rawToolPrompts !== 'object' || Array.isArray(rawToolPrompts)) {
    return {};
  }

  const raw = rawToolPrompts as Record<string, unknown>;
  const allowedToolIds = getToolIdsForCard(cardId);
  const result: Partial<Record<FlowToolId, LocalizedToolPrompt>> = {};

  for (const toolId of allowedToolIds) {
    const localized = resolveLocalizedToolPrompt(raw[toolId]);
    if (Object.keys(localized).length === 0) continue;

    result[toolId] = {
      ...localized,
      es: resolveToolPromptForLocale(localized, 'es') ?? '',
      en: resolveToolPromptForLocale(localized, 'en') ?? '',
    };
  }

  return result;
}

export function getEnabledToolPromptsForCard(
  cardId: FlowCardId,
  cardConfig: Record<string, unknown> | undefined,
  locale = 'es'
): Partial<Record<FlowToolId, string>> {
  const rawToolPrompts = cardConfig?.toolPrompts;
  if (!rawToolPrompts || typeof rawToolPrompts !== 'object' || Array.isArray(rawToolPrompts)) {
    return {};
  }

  const raw = rawToolPrompts as Record<string, unknown>;
  const allowedToolIds = getToolIdsForCard(cardId);
  const result: Partial<Record<FlowToolId, string>> = {};

  for (const toolId of allowedToolIds) {
    const normalized = resolveToolPromptForLocale(raw[toolId], locale);
    if (!normalized) continue;
    result[toolId] = normalized;
  }

  return result;
}
