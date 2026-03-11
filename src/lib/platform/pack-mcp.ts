import type { FlowPackServerModule } from './pack-server';
import { ZodType } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export interface FlowPackMcpRuntimeContext {
  enabledCardIds: ReadonlySet<string>;
  cardConfigById: Record<string, Record<string, unknown>>;
}

export interface FlowPackMcpToolExecutionContext extends FlowPackMcpRuntimeContext {
  packId: string;
  toolName: string;
}

export interface FlowPackMcpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  enabledForCardIds: readonly string[];
  execute: (
    args: unknown,
    context: FlowPackMcpToolExecutionContext
  ) => Promise<unknown> | unknown;
}

export interface FlowPackMcpModule {
  tools?: readonly FlowPackMcpToolDefinition[];
}

export interface FlowPackMcpRegistryEntry {
  packId: string;
  module: FlowPackMcpModule;
}

export interface ResolvedFlowPackMcpTool extends FlowPackMcpToolDefinition {
  packId: string;
}

interface FlowPackCardToolMapping {
  id: string;
  supportedToolIds?: readonly string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function resolveMcpInputSchema(inputSchema: unknown): Record<string, unknown> {
  if (inputSchema instanceof ZodType) {
    return zodToJsonSchema(inputSchema, {
      $refStrategy: 'none',
      target: 'jsonSchema7',
    }) as Record<string, unknown>;
  }

  if (isRecord(inputSchema)) {
    return inputSchema;
  }

  return { type: 'object' };
}

function inferEnabledCardIdsForTool(
  cards: readonly FlowPackCardToolMapping[],
  toolId: string
): string[] {
  return cards
    .filter((card) => card.supportedToolIds?.includes(toolId))
    .map((card) => card.id);
}

export function createFlowPackMcpModuleFromServerModule(input: {
  cards: readonly FlowPackCardToolMapping[];
  serverModule: FlowPackServerModule;
}): FlowPackMcpModule {
  const tools = Object.entries(input.serverModule.tools ?? {}).flatMap(([toolId, toolFactory]) => {
    if (typeof toolFactory !== 'function') {
      return [];
    }

    const enabledForCardIds = inferEnabledCardIdsForTool(input.cards, toolId);
    if (enabledForCardIds.length === 0) {
      return [];
    }

    const tool = toolFactory({
      isEnglish: false,
      detectedPlate: null,
      enabledCardIds: new Set(enabledForCardIds),
      cardConfigById: {},
    });

    if (typeof tool?.execute !== 'function') {
      return [];
    }

    return [
      {
        name: toolId,
        description: `Auto-generated MCP wrapper for ${toolId}.`,
        inputSchema: resolveMcpInputSchema(tool.inputSchema),
        enabledForCardIds,
        execute: async (args: unknown, context: FlowPackMcpToolExecutionContext) => {
          const tool = toolFactory({
            isEnglish: false,
            detectedPlate: null,
            enabledCardIds: context.enabledCardIds,
            cardConfigById: context.cardConfigById,
          });

          if (typeof tool?.execute !== 'function') {
            throw new Error(`Server tool "${toolId}" does not expose an executable handler.`);
          }

          return tool.execute(args, {
            toolCallId: `mcp_${context.packId}_${toolId}`,
            messages: [],
            experimental_context: context,
          });
        },
      } satisfies FlowPackMcpToolDefinition,
    ];
  });

  return { tools };
}

export function isFlowPackMcpToolEnabled(
  tool: FlowPackMcpToolDefinition,
  enabledCardIds: ReadonlySet<string>
): boolean {
  return tool.enabledForCardIds.some((cardId) => enabledCardIds.has(cardId));
}

export function resolveEnabledFlowPackMcpTools(
  entries: readonly FlowPackMcpRegistryEntry[],
  enabledCardIds: ReadonlySet<string>
): Map<string, ResolvedFlowPackMcpTool> {
  const resolvedTools = new Map<string, ResolvedFlowPackMcpTool>();

  for (const entry of entries) {
    for (const tool of entry.module.tools ?? []) {
      if (!isFlowPackMcpToolEnabled(tool, enabledCardIds)) {
        continue;
      }

      const existing = resolvedTools.get(tool.name);
      if (existing) {
        throw new Error(
          `Duplicate MCP tool "${tool.name}" is enabled by packs "${existing.packId}" and "${entry.packId}".`
        );
      }

      resolvedTools.set(tool.name, {
        ...tool,
        packId: entry.packId,
      });
    }
  }

  return resolvedTools;
}
