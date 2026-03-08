import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getFreeTierStatusForUser } from '@/lib/profile/usage';
import { getUsernameFromRequest, isClerkAuthEnabled } from '@/lib/auth';
import { resolveAiProviderApiKey } from '@/lib/ai-providers';
import { buildSystemPrompt } from './prompts';
import { getAgentTools } from './agent-tools';
import { resolveFlowPackChatRuntime } from './flow-pack-runtime';
import { createChatResponseStream } from './streaming';
import { getFlowCardSettings } from '@/lib/platform/settings';
import { FLOW_CARD_DEFINITIONS } from '@/lib/platform/cards';
import { ensureCurrentClerkUserAccess } from '@/lib/access/clerk-user';

vi.mock('ai', () => ({
  streamText: vi.fn(),
}));

vi.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: vi.fn(() => vi.fn(() => 'mock-google-model')),
}));

vi.mock('@/lib/profile/usage', () => ({
  getFreeTierStatusForUser: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  getUsernameFromRequest: vi.fn(() => 'anonymous'),
  isClerkAuthEnabled: vi.fn(() => false),
}));

vi.mock('@/lib/access/clerk-user', () => ({
  ensureCurrentClerkUserAccess: vi.fn(),
}));

vi.mock('@/lib/ai-providers', () => ({
  resolveAiProviderApiKey: vi.fn(),
}));

vi.mock('./prompts', () => ({
  buildSystemPrompt: vi.fn(() => 'mock-system-prompt'),
}));

vi.mock('./agent-tools', () => ({
  getAgentTools: vi.fn(() => ({ show_weather_forecast: {} })),
}));

vi.mock('./flow-pack-runtime', () => ({
  resolveFlowPackChatRuntime: vi.fn(),
}));

vi.mock('./streaming', () => ({
  createChatResponseStream: vi.fn(),
}));

vi.mock('@/lib/platform/settings', () => ({
  getFlowCardSettings: vi.fn(),
}));

function createEmptyEventStream() {
  return {
    async *[Symbol.asyncIterator]() {
      yield* [];
    },
  };
}

function createTextStream(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

function createChatRequest(payload: unknown): Request {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

describe('POST /api/chat', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv, GOOGLE_GENERATIVE_AI_API_KEY: 'test-key' };
    vi.mocked(resolveAiProviderApiKey).mockResolvedValue('test-key');
    vi.mocked(getUsernameFromRequest).mockReturnValue('anonymous');
    vi.mocked(isClerkAuthEnabled).mockReturnValue(false);
    vi.mocked(ensureCurrentClerkUserAccess).mockResolvedValue(null);
    vi.mocked(getFreeTierStatusForUser).mockResolvedValue({
      isLimited: false,
      isAnonymous: true,
      usedTokens: 0,
      usedQuotes: 0,
      tokenLimit: 3000000,
      quoteLimit: 50,
      remainingTokens: 3000000,
      remainingQuotes: 50,
      hasReachedTokenLimit: false,
      hasReachedQuoteLimit: false,
    });
    vi.mocked(getFlowCardSettings).mockResolvedValue({
      enabledByCardId: {
        weather_forecast: true,
      },
      configByCardId: {},
    });
    vi.mocked(resolveFlowPackChatRuntime).mockResolvedValue({
      earlyResponse: null,
      toolContext: {
        detectedPlate: null,
        enabledComparisonProviderCodes: [],
        enabledSingleProviderCodes: [],
      },
      streamFeedbackByToolId: {},
      usageRecorders: [],
    });
    vi.mocked(streamText).mockReturnValue({
      fullStream: createEmptyEventStream(),
      totalUsage: Promise.resolve({}),
    } as never);
    vi.mocked(createChatResponseStream).mockReturnValue(createTextStream('ok'));
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('creates the Gemini provider with the resolved key', async () => {
    const response = await POST(
      createChatRequest({
        locale: 'es',
        messages: [{ role: 'user', content: 'hola' }],
      })
    );

    expect(response.status).toBe(200);
    expect(createGoogleGenerativeAI).toHaveBeenCalledWith({ apiKey: 'test-key' });
    expect(buildSystemPrompt).toHaveBeenCalled();
    expect(getAgentTools).toHaveBeenCalled();
    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'mock-google-model',
        system: 'mock-system-prompt',
        tools: { show_weather_forecast: {} },
      })
    );
  });

  it('returns 401 when Clerk auth is enabled and the request resolves to an anonymous user', async () => {
    vi.mocked(isClerkAuthEnabled).mockReturnValue(true);

    const response = await POST(
      createChatRequest({
        locale: 'es',
        messages: [{ role: 'user', content: 'hola' }],
      })
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
    expect(streamText).not.toHaveBeenCalled();
  });

  it('provisions viewer role when Clerk auth is enabled and the user has no assigned role yet', async () => {
    vi.mocked(isClerkAuthEnabled).mockReturnValue(true);
    vi.mocked(ensureCurrentClerkUserAccess).mockResolvedValueOnce({
      userId: 'user_no_role',
      username: 'norole@example.com',
      displayName: 'No Role Yet',
      publicMetadata: { role: 'viewer' },
    });

    const response = await POST(
      createChatRequest({
        locale: 'es',
        messages: [{ role: 'user', content: 'hola' }],
      })
    );

    expect(response.status).toBe(200);
    expect(streamText).toHaveBeenCalled();
  });

  it('allows Clerk users without metadata when a local dev role override is set', async () => {
    process.env.DEV_AUTH_ROLE = 'viewer';
    vi.mocked(isClerkAuthEnabled).mockReturnValue(true);
    vi.mocked(ensureCurrentClerkUserAccess).mockResolvedValueOnce({
      userId: 'user_local',
      username: 'local@example.com',
      displayName: 'Local Dev',
      publicMetadata: { role: 'viewer' },
    });

    const response = await POST(
      createChatRequest({
        locale: 'es',
        messages: [{ role: 'user', content: 'hola' }],
      })
    );

    expect(response.status).toBe(200);
    expect(streamText).toHaveBeenCalled();
  });

  it('returns an early flow-pack response before calling the model', async () => {
    const earlyResponse = Response.json({ ok: true }, { status: 202 });
    vi.mocked(resolveFlowPackChatRuntime).mockResolvedValueOnce({
      earlyResponse,
      toolContext: {},
      streamFeedbackByToolId: {},
      usageRecorders: [],
    });

    const response = await POST(
      createChatRequest({
        locale: 'es',
        messages: [{ role: 'user', content: 'hola' }],
      })
    );

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({ ok: true });
    expect(streamText).not.toHaveBeenCalled();
  });

  it('returns a no-active-flows stream when every card is disabled', async () => {
    vi.mocked(getFlowCardSettings).mockResolvedValueOnce({
      enabledByCardId: Object.fromEntries(
        FLOW_CARD_DEFINITIONS.map((card) => [card.id, false])
      ),
      configByCardId: {},
    });

    const response = await POST(
      createChatRequest({
        locale: 'es',
        messages: [{ role: 'user', content: 'hola' }],
      })
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toContain('No hay flujos activos en este momento');
    expect(streamText).not.toHaveBeenCalled();
  });

  it('returns 429 when the user has reached the free tier limit', async () => {
    vi.mocked(getFreeTierStatusForUser).mockResolvedValueOnce({
      isLimited: true,
      isAnonymous: true,
      usedTokens: 3000000,
      usedQuotes: 50,
      tokenLimit: 3000000,
      quoteLimit: 50,
      remainingTokens: 0,
      remainingQuotes: 0,
      hasReachedTokenLimit: true,
      hasReachedQuoteLimit: true,
    });

    const response = await POST(
      createChatRequest({
        locale: 'es',
        messages: [{ role: 'user', content: 'hola' }],
      })
    );

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        error: 'FREE_TIER_LIMIT_REACHED',
      })
    );
    expect(streamText).not.toHaveBeenCalled();
  });

  it('resolves slash commands against enabled cards and forwards the forced tool id', async () => {
    await POST(
      createChatRequest({
        locale: 'en',
        messages: [{ role: 'user', content: '/weather Bogota' }],
      })
    );

    expect(resolveFlowPackChatRuntime).toHaveBeenCalledWith(
      expect.objectContaining({
        forcedToolId: 'show_weather_forecast',
      })
    );
  });
});
