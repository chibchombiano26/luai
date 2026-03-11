import { type AppLocale } from '@/lib/i18n';
import {
  GENERATED_FLOW_CARD_DEFINITIONS,
} from './generated-flow-packs';
import { isFlowCardId, type FlowCardId } from './cards';

type GeneratedCommandDefinition = {
  id: string;
  toolId: string;
  name?: Record<string, string>;
  description?: Record<string, string>;
  category?: Record<string, string>;
  example?: Record<string, string>;
  prompt?: Record<string, string>;
  aliases?: Record<string, string[]>;
};

type GeneratedCardWithCommands = {
  id: FlowCardId;
  packId: string;
  category: string;
  supportedToolIds: readonly string[];
  name?: Record<string, string>;
  description?: Record<string, string>;
  commands?: GeneratedCommandDefinition[];
};

const CARD_DEFINITIONS = GENERATED_FLOW_CARD_DEFINITIONS as unknown as readonly GeneratedCardWithCommands[];

const SCOPE_STOPWORDS = new Set([
  'a',
  'al',
  'and',
  'con',
  'current',
  'como',
  'de',
  'del',
  'dame',
  'el',
  'en',
  'for',
  'get',
  'give',
  'hola',
  'i',
  'is',
  'la',
  'las',
  'los',
  'me',
  'mi',
  'muestrame',
  'muestrame',
  'my',
  'of',
  'para',
  'por',
  'precio',
  'quiero',
  'que',
  'show',
  'estas',
  'esta',
  'esto',
  'temperature',
  'the',
  'un',
  'una',
  'ver',
]);

function normalizeText(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toTokens(value: string | null | undefined): string[] {
  return normalizeText(value)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !SCOPE_STOPWORDS.has(token));
}

function toStem(token: string): string {
  return token.slice(0, Math.min(token.length, 5));
}

function addLocalizedSignals(
  bucket: Set<string>,
  locale: AppLocale,
  value?: Record<string, string>
) {
  const localizedValue = value?.[locale];
  if (!localizedValue) return;

  for (const token of toTokens(localizedValue)) {
    bucket.add(token);
  }

  const normalized = normalizeText(localizedValue.replace(/^\//, ''));
  if (normalized) {
    bucket.add(normalized);
  }
}

function addLocalizedAliasSignals(
  bucket: Set<string>,
  locale: AppLocale,
  aliases?: Record<string, string[]>
) {
  const localizedAliases = aliases?.[locale] ?? [];
  for (const alias of localizedAliases) {
    const normalizedAlias = normalizeText(alias.replace(/^\//, ''));
    if (normalizedAlias) {
      bucket.add(normalizedAlias);
    }
    for (const token of toTokens(alias)) {
      bucket.add(token);
    }
  }
}

function buildScopeSignals(card: GeneratedCardWithCommands, locale: AppLocale): Set<string> {
  const signals = new Set<string>();

  signals.add(normalizeText(card.category));
  addLocalizedSignals(signals, locale, card.name);
  addLocalizedSignals(signals, locale, card.description);

  for (const command of card.commands ?? []) {
    addLocalizedSignals(signals, locale, command.name);
    addLocalizedSignals(signals, locale, command.description);
    addLocalizedSignals(signals, locale, command.category);
    addLocalizedSignals(signals, locale, command.example);
    addLocalizedSignals(signals, locale, command.prompt);
    addLocalizedAliasSignals(signals, locale, command.aliases);
  }

  return new Set(
    Array.from(signals).filter((signal) => signal.length >= 4 && !SCOPE_STOPWORDS.has(signal))
  );
}

function phraseOccurs(text: string, signal: string): boolean {
  if (!signal) return false;
  if (signal.includes(' ')) {
    return text.includes(signal);
  }

  const pattern = new RegExp(`(^|\\s)${signal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`, 'i');
  return pattern.test(text);
}

export function inferScopedToolIdsFromCardMetadata(input: {
  enabledCardIds: ReadonlySet<string>;
  locale: AppLocale;
  message: string;
}): Set<string> | null {
  const normalizedMessage = normalizeText(input.message);
  if (!normalizedMessage) {
    return null;
  }

  const messageTokenStems = new Set(toTokens(normalizedMessage).map(toStem));
  const scoredCards: Array<{
    cardId: FlowCardId;
    packId: string;
    category: string;
    score: number;
    toolIds: readonly string[];
  }> = [];

  for (const card of CARD_DEFINITIONS) {
    if (!input.enabledCardIds.has(card.id) || !isFlowCardId(card.id)) {
      continue;
    }

    const signals = buildScopeSignals(card, input.locale);
    let score = 0;

    for (const signal of signals) {
      if (phraseOccurs(normalizedMessage, signal)) {
        score += signal.includes(' ') ? 4 : 3;
        continue;
      }

      const signalStem = toStem(signal);
      if (signalStem.length >= 4 && messageTokenStems.has(signalStem)) {
        score += 1;
      }
    }

    if (score > 0) {
      scoredCards.push({
        cardId: card.id,
        packId: card.packId,
        category: card.category,
        score,
        toolIds: card.supportedToolIds,
      });
    }
  }

  if (scoredCards.length === 0) {
    return null;
  }

  scoredCards.sort((a, b) => b.score - a.score || a.cardId.localeCompare(b.cardId));
  const topScore = scoredCards[0].score;
  if (topScore < 3) {
    return null;
  }

  const topCards = scoredCards.filter((card) => card.score === topScore);
  const sameScopeFamily =
    topCards.every((card) => card.packId === topCards[0].packId) ||
    topCards.every((card) => card.category === topCards[0].category);

  if (!sameScopeFamily && topCards.length > 1) {
    return null;
  }

  const toolIds = new Set<string>();
  for (const card of topCards) {
    for (const toolId of card.toolIds) {
      toolIds.add(toolId);
    }
  }

  return toolIds.size > 0 ? toolIds : null;
}
