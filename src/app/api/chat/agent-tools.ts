import type { ToolSet } from 'ai';
import { ToolContext } from './agent-tools-types';
import {
  FLOW_CARD_DEFINITIONS,
  getFlowCardDefinition,
  isFlowCardId,
  type FlowCardId,
} from '@/lib/platform/cards';
import { GENERATED_FLOW_PACK_SERVER_MODULES } from '@/lib/platform/generated-flow-pack-server';

export type { ToolContext };

export const getAgentTools = (
  context: ToolContext,
  options?: { allowedToolIds?: ReadonlySet<string> | null }
): ToolSet => {
  const defaultEnabledCards = new Set<FlowCardId>(
    FLOW_CARD_DEFINITIONS.filter((card) => card.defaultEnabled).map((card) => card.id)
  );
  const enabledCardIds = context.enabledCardIds ?? defaultEnabledCards;
  const allowedToolIds = options?.allowedToolIds ?? null;

  const tools: ToolSet = {};

  for (const cardId of enabledCardIds) {
    if (!isFlowCardId(cardId)) continue;
    const card = getFlowCardDefinition(cardId);
    const serverModule = GENERATED_FLOW_PACK_SERVER_MODULES[card.packId];
    if (!serverModule?.tools) continue;

    for (const toolId of card.supportedToolIds) {
      if (allowedToolIds && !allowedToolIds.has(toolId)) continue;
      const factory = serverModule.tools[toolId];
      if (typeof factory !== 'function') continue;
      tools[toolId] = factory(context);
    }
  }

  return tools;
};
