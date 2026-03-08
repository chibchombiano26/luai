import type { FlowCardId } from './cards';
import { GENERATED_DEFAULT_CARD_SYSTEM_PROMPTS } from './generated-flow-packs';

export const CARD_SYSTEM_PROMPT_MAX_LENGTH = 1800;

export type LocalizedCardSystemPrompt = Record<string, string>;

export const DEFAULT_CARD_SYSTEM_PROMPTS =
  GENERATED_DEFAULT_CARD_SYSTEM_PROMPTS as Record<FlowCardId, LocalizedCardSystemPrompt>;

function normalizeLocaleKey(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return normalized;
}

function sanitizePromptValue(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.slice(0, CARD_SYSTEM_PROMPT_MAX_LENGTH);
}

function sanitizeLocalizedPromptMap(value: unknown): LocalizedCardSystemPrompt {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const result: LocalizedCardSystemPrompt = {};

  for (const [localeKey, localeValue] of Object.entries(raw)) {
    const normalizedKey = normalizeLocaleKey(localeKey);
    const normalizedPrompt = sanitizePromptValue(localeValue);
    if (!normalizedKey || !normalizedPrompt) continue;
    result[normalizedKey] = normalizedPrompt;
  }

  return result;
}

function localeCandidates(locale: string): string[] {
  const normalized = normalizeLocaleKey(locale) ?? 'es';
  const base = normalized.split('-')[0] ?? normalized;
  return Array.from(new Set([normalized, base, 'en', 'es']));
}

function resolvePromptForLocaleValue(
  promptByLocale: LocalizedCardSystemPrompt,
  locale: string
): string | null {
  for (const candidate of localeCandidates(locale)) {
    const value = promptByLocale[candidate];
    if (typeof value === 'string' && value.trim()) return value;
  }
  const firstValue = Object.values(promptByLocale).find(
    (value): value is string => typeof value === 'string' && value.trim().length > 0
  );
  return firstValue ?? null;
}

export function resolveCardSystemPromptByLocale(
  cardId: FlowCardId,
  cardConfig: Record<string, unknown> | undefined
): LocalizedCardSystemPrompt {
  const fallback = DEFAULT_CARD_SYSTEM_PROMPTS[cardId];
  const legacyPrompt = sanitizePromptValue(cardConfig?.systemPrompt);
  const localizedPrompt = sanitizeLocalizedPromptMap(cardConfig?.systemPromptByLocale);

  return {
    ...localizedPrompt,
    es: sanitizePromptValue(localizedPrompt.es) ?? legacyPrompt ?? fallback.es,
    en: sanitizePromptValue(localizedPrompt.en) ?? legacyPrompt ?? fallback.en,
  };
}

export function resolveCardSystemPromptForLocale(params: {
  cardId: FlowCardId;
  cardConfig: Record<string, unknown> | undefined;
  locale: string;
}): string {
  const promptByLocale = resolveCardSystemPromptByLocale(params.cardId, params.cardConfig);
  const resolved = resolvePromptForLocaleValue(promptByLocale, params.locale);
  const fallback = DEFAULT_CARD_SYSTEM_PROMPTS[params.cardId];
  return resolved ?? fallback.es;
}

export function isValidCardSystemPromptByLocale(
  value: unknown
): value is LocalizedCardSystemPrompt {
  const prompt = sanitizeLocalizedPromptMap(value);
  const es = sanitizePromptValue(prompt.es);
  const en = sanitizePromptValue(prompt.en);

  return !!es && !!en;
}
