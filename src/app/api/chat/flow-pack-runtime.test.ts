import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatRequestContext } from './parser';

const mockRequestContext = {} as ChatRequestContext;

describe('resolveFlowPackChatRuntime', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('returns empty runtime state when no enabled modules match', async () => {
    vi.doMock('@/lib/platform/generated-flow-pack-server', () => ({
      GENERATED_FLOW_PACK_SERVER_MODULES: {},
    }));

    const { resolveFlowPackChatRuntime } = await import('./flow-pack-runtime');
    const result = await resolveFlowPackChatRuntime({
      requestContext: mockRequestContext,
      enabledCardIds: new Set(['weather_forecast']),
      cardConfigById: {},
      forcedToolId: null,
      username: 'tester',
    });

    expect(result).toEqual({
      allowedToolIds: null,
      earlyResponse: null,
      toolContext: {},
      streamFeedbackByToolId: {},
      usageRecorders: [],
    });
  });

  it('merges stream feedback and stops after the first early response', async () => {
    const earlyResponse = new Response('early', { status: 202 });
    const alphaResolve = vi.fn().mockResolvedValue({
      toolContext: { userPrompt: 'alpha' },
      streamFeedbackByToolId: {
        alpha_tool: {
          startStatusMessage: { es: 'uno', en: 'one' },
        },
      },
    });
    const betaResolve = vi.fn().mockResolvedValue({
      earlyResponse,
      toolContext: { systemPrompt: 'beta' },
      streamFeedbackByToolId: {
        beta_tool: {
          startTextMessage: { es: 'dos', en: 'two' },
        },
      },
    });
    const skippedResolve = vi.fn().mockResolvedValue({
      toolContext: { shouldNotRun: true },
    });

    vi.doMock('@/lib/platform/generated-flow-pack-server', () => ({
      GENERATED_FLOW_PACK_SERVER_MODULES: {
        alpha: {
          chat: {
            resolveRuntime: alphaResolve,
            streamFeedbackByToolId: {
              alpha_shared_tool: {
                startTextMessage: { es: 'tres', en: 'three' },
              },
            },
          },
        },
        beta: {
          chat: {
            resolveRuntime: betaResolve,
          },
        },
        later: {
          chat: {
            resolveRuntime: skippedResolve,
          },
        },
      },
    }));

    vi.doMock('@/lib/platform/cards', () => ({
      isFlowCardId: (cardId: unknown) => typeof cardId === 'string',
      getFlowCardDefinition: (cardId: string) => ({
        id: cardId,
        packId: cardId === 'alpha_card' ? 'alpha' : cardId === 'beta_card' ? 'beta' : 'later',
      }),
    }));

    const { resolveFlowPackChatRuntime } = await import('./flow-pack-runtime');
    const result = await resolveFlowPackChatRuntime({
      requestContext: mockRequestContext,
      enabledCardIds: new Set(['alpha_card', 'beta_card', 'later_card']),
      cardConfigById: {},
      forcedToolId: null,
      username: 'tester',
    });

    expect(alphaResolve).toHaveBeenCalledTimes(1);
    expect(betaResolve).toHaveBeenCalledTimes(1);
    expect(skippedResolve).not.toHaveBeenCalled();
    expect(result.earlyResponse).toBe(earlyResponse);
    expect(result.toolContext).toEqual({
      userPrompt: 'alpha',
      systemPrompt: 'beta',
    });
    expect(result.streamFeedbackByToolId).toEqual({
      alpha_shared_tool: {
        startTextMessage: { es: 'tres', en: 'three' },
      },
      alpha_tool: {
        startStatusMessage: { es: 'uno', en: 'one' },
      },
      beta_tool: {
        startTextMessage: { es: 'dos', en: 'two' },
      },
    });
  });
});
