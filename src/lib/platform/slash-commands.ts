import { isChatCommandId, type ChatCommandId } from '@/lib/chat/commands';
import type { FlowCardId } from './cards';
import {
  GENERATED_CARD_TO_COMMAND_IDS,
  GENERATED_MENU_COMMAND_IDS,
} from './generated-flow-packs';

const CARD_TO_COMMAND_IDS =
  GENERATED_CARD_TO_COMMAND_IDS as Record<FlowCardId, readonly ChatCommandId[]>;

export const MENU_COMMAND_IDS = [...GENERATED_MENU_COMMAND_IDS] as ChatCommandId[];

function getCardConfig(
  cardConfigById: Record<string, Record<string, unknown>> | undefined,
  cardId: FlowCardId
): Record<string, unknown> | undefined {
  return cardConfigById?.[cardId];
}

export function getSlashCommandIdsForCard(cardId: FlowCardId): ChatCommandId[] {
  return Array.from(CARD_TO_COMMAND_IDS[cardId] ?? []);
}

export function getEnabledSlashCommandIdsForCard(
  cardId: FlowCardId,
  cardConfig?: Record<string, unknown>
): ChatCommandId[] {
  const available = CARD_TO_COMMAND_IDS[cardId] ?? [];
  const rawEnabledCommands = cardConfig?.enabledCommands;
  if (!Array.isArray(rawEnabledCommands)) {
    return Array.from(available);
  }

  const enabledByConfig = new Set(
    rawEnabledCommands
      .filter(isChatCommandId)
      .filter((commandId) => available.includes(commandId))
  );

  return available.filter((commandId) => enabledByConfig.has(commandId));
}

export function getSlashCommandIdsForEnabledCards(
  enabledCardIds: Iterable<FlowCardId>,
  cardConfigById?: Record<string, Record<string, unknown>>
): ChatCommandId[] {
  const unique = new Set<ChatCommandId>();
  for (const cardId of enabledCardIds) {
    const cardConfig = getCardConfig(cardConfigById, cardId);
    for (const commandId of getEnabledSlashCommandIdsForCard(cardId, cardConfig)) {
      unique.add(commandId);
    }
  }

  return Array.from(unique);
}

export function getMenuCommandIdsForEnabledCards(
  enabledCardIds: Iterable<FlowCardId>,
  cardConfigById?: Record<string, Record<string, unknown>>
): ChatCommandId[] {
  const enabledCardSet = new Set<FlowCardId>(enabledCardIds);
  const enabledSlashCommandSet = new Set(
    getSlashCommandIdsForEnabledCards(enabledCardSet, cardConfigById)
  );

  return MENU_COMMAND_IDS.filter((commandId) => enabledSlashCommandSet.has(commandId));
}
