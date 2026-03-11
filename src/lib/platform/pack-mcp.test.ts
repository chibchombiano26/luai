import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  createFlowPackMcpModuleFromServerModule,
  isFlowPackMcpToolEnabled,
  resolveEnabledFlowPackMcpTools,
  type FlowPackMcpRegistryEntry,
} from './pack-mcp';
import { GENERATED_FLOW_PACK_MCP_MODULES } from '@/mcp-server/generated-flow-pack-mcp';

const REGISTRY: readonly FlowPackMcpRegistryEntry[] = [
  {
    packId: 'alpha',
    module: {
      tools: [
        {
          name: 'alpha_tool',
          description: 'Alpha tool',
          inputSchema: { type: 'object' },
          enabledForCardIds: ['card_alpha'],
          execute: () => ({ ok: true }),
        },
      ],
    },
  },
  {
    packId: 'beta',
    module: {
      tools: [
        {
          name: 'beta_tool',
          description: 'Beta tool',
          inputSchema: { type: 'object' },
          enabledForCardIds: ['card_beta'],
          execute: () => ({ ok: true }),
        },
      ],
    },
  },
] as const;

describe('flow-pack MCP registry', () => {
  it('filters MCP tools by enabled cards', () => {
    const tools = resolveEnabledFlowPackMcpTools(REGISTRY, new Set(['card_alpha']));

    expect([...tools.keys()]).toEqual(['alpha_tool']);
    expect(tools.get('alpha_tool')).toEqual(
      expect.objectContaining({
        packId: 'alpha',
        name: 'alpha_tool',
      })
    );
  });

  it('recognizes when a tool is enabled by at least one active card', () => {
    expect(
      isFlowPackMcpToolEnabled(
        {
          name: 'lookup',
          description: 'Lookup',
          inputSchema: { type: 'object' },
          enabledForCardIds: ['card_alpha', 'card_beta'],
          execute: () => ({ ok: true }),
        },
        new Set(['card_beta'])
      )
    ).toBe(true);
  });

  it('throws when two enabled packs expose the same MCP tool name', () => {
    expect(() =>
      resolveEnabledFlowPackMcpTools(
        [
          {
            packId: 'alpha',
            module: {
              tools: [
                {
                  name: 'shared_tool',
                  description: 'Shared',
                  inputSchema: { type: 'object' },
                  enabledForCardIds: ['card_alpha'],
                  execute: () => ({ ok: true }),
                },
              ],
            },
          },
          {
            packId: 'beta',
            module: {
              tools: [
                {
                  name: 'shared_tool',
                  description: 'Shared too',
                  inputSchema: { type: 'object' },
                  enabledForCardIds: ['card_beta'],
                  execute: () => ({ ok: true }),
                },
              ],
            },
          },
        ],
        new Set(['card_alpha', 'card_beta'])
      )
    ).toThrow('Duplicate MCP tool "shared_tool"');
  });

  it('uses the generated mcp export instead of the module namespace', () => {
    expect(GENERATED_FLOW_PACK_MCP_MODULES.length).toBeGreaterThan(0);
    expect(
      GENERATED_FLOW_PACK_MCP_MODULES.every((entry) => (entry.module.tools?.length ?? 0) > 0)
    ).toBe(true);
    expect(GENERATED_FLOW_PACK_MCP_MODULES.map((entry) => entry.packId)).toEqual(
      expect.arrayContaining(['markets', 'weather'])
    );
  });

  it('derives MCP tools from server tools when a pack has no explicit MCP module', async () => {
    const module = createFlowPackMcpModuleFromServerModule({
      cards: [
        {
          id: 'market_asset_lookup',
          supportedToolIds: ['show_market_asset'],
        },
      ],
      serverModule: {
        tools: {
          show_market_asset: () => ({
            description: 'Lookup market asset',
            inputSchema: z.object({
              symbol: z.string().optional(),
              asset: z.string().optional(),
              query: z.string().optional(),
            }),
            execute: async (args: unknown) => ({ echoed: args }),
          }),
        },
      },
    });

    expect(module.tools).toEqual([
      expect.objectContaining({
        name: 'show_market_asset',
        enabledForCardIds: ['market_asset_lookup'],
        inputSchema: expect.objectContaining({
          type: 'object',
          properties: expect.objectContaining({
            symbol: { type: 'string' },
            asset: { type: 'string' },
            query: { type: 'string' },
          }),
        }),
      }),
    ]);

    await expect(
      module.tools?.[0]?.execute(
        { symbol: 'XAU' },
        {
          packId: 'markets',
          toolName: 'show_market_asset',
          enabledCardIds: new Set(['market_asset_lookup']),
          cardConfigById: {},
        }
      )
    ).resolves.toEqual({ echoed: { symbol: 'XAU' } });
  });
});
