import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createChatResponseStream } from './streaming';

vi.mock('@/lib/profile/usage', () => ({
  recordUsageEvent: vi.fn(),
  recordQuoteEvent: vi.fn(),
}));

vi.mock('./host-messages', () => ({
  getHostTranslation: vi.fn(() => 'fallback-message'),
}));

import { recordQuoteEvent, recordUsageEvent } from '@/lib/profile/usage';

function createAsyncIterable<T>(items: T[], error?: unknown): AsyncIterable<T> {
  return {
    async *[Symbol.asyncIterator]() {
      for (const item of items) {
        yield item;
      }
      if (error) {
        throw error;
      }
    },
  };
}

async function readStream(stream: ReadableStream<Uint8Array>): Promise<string[]> {
  const text = await new Response(stream).text();
  return text
    .trim()
    .split('\n')
    .filter(Boolean);
}

describe('createChatResponseStream', () => {
  const requestContext = {
    rawMessages: [],
    messages: [],
    locale: 'es' as const,
    isEnglish: false,
    sessionId: null,
    username: 'user',
    hasQuoteContext: false,
    explicitCommandId: null,
    lastUserMessageIndex: -1,
    lastUserMessage: '',
    slashCommandId: null,
    normalizedLastUserMessage: '',
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('streams text, tool feedback and tool results while recording usage', async () => {
    const privateUsageRecorder = vi.fn().mockResolvedValue(undefined);
    const stream = createChatResponseStream({
      result: {
        fullStream: createAsyncIterable([
          { type: 'text-delta', text: 'hola' },
          { type: 'tool-call', toolName: 'quote_vehicle_policy' },
          { type: 'tool-result', output: { type: 'quote_result', quoteId: 'q_1' } },
        ]),
        totalUsage: Promise.resolve({
          inputTokens: 10,
          outputTokens: 20,
          totalTokens: 30,
        }),
      },
      username: 'jose',
      modelName: 'gemini-flash-latest',
      locale: 'es',
      sessionId: 'session-1',
      isEnglish: false,
      getQuotesGenerated: () => 2,
      toolStreamFeedbackById: {
        quote_vehicle_policy: {
          startStatusMessage: { es: 'consultando', en: 'fetching' },
          startTextMessage: { es: 'generando', en: 'generating' },
        },
      },
      actorUserId: 'user_123',
      requestContext,
      onPrivateFlowUsageRecorded: privateUsageRecorder,
    });

    const payloads = await readStream(stream);

    expect(payloads.map((line) => JSON.parse(line))).toEqual([
      { type: 'text', content: 'hola' },
      { type: 'status', status: 'start', message: 'consultando' },
      { type: 'text', content: 'generando' },
      { type: 'status', status: 'end' },
      { type: 'tool', toolType: 'quote_result', data: { type: 'quote_result', quoteId: 'q_1' } },
    ]);

    expect(recordUsageEvent).toHaveBeenCalledWith({
      username: 'jose',
      model: 'gemini-flash-latest',
      locale: 'es',
      sessionId: 'session-1',
      inputTokens: 10,
      outputTokens: 20,
      totalTokens: 30,
    });
    expect(recordQuoteEvent).toHaveBeenCalledWith({
      username: 'jose',
      model: 'gemini-flash-latest',
      locale: 'es',
      sessionId: 'session-1',
      quoteCount: 2,
    });
    expect(privateUsageRecorder).toHaveBeenCalledWith({
      requestContext,
      actorUserId: 'user_123',
      username: 'jose',
      locale: 'es',
      sessionId: 'session-1',
      modelName: 'gemini-flash-latest',
      inputTokens: 10,
      outputTokens: 20,
      totalTokens: 30,
      quoteCount: 2,
    });
  });

  it('emits a fallback host message when no payload was streamed', async () => {
    const stream = createChatResponseStream({
      result: {
        fullStream: createAsyncIterable([]),
        totalUsage: Promise.resolve({}),
      },
      username: 'jose',
      modelName: 'gemini-flash-latest',
      locale: 'es',
      sessionId: null,
      isEnglish: false,
      getQuotesGenerated: () => 0,
      actorUserId: null,
      requestContext,
    });

    const payloads = await readStream(stream);
    expect(payloads.map((line) => JSON.parse(line))).toEqual([
      { type: 'text', content: 'fallback-message' },
    ]);
  });

  it('closes cleanly on abort errors', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const canceledError = new Error('request canceled');
    canceledError.name = 'CanceledError';

    const stream = createChatResponseStream({
      result: {
        fullStream: createAsyncIterable([], canceledError),
        totalUsage: Promise.resolve({}),
      },
      username: 'jose',
      modelName: 'gemini-flash-latest',
      locale: 'es',
      sessionId: null,
      isEnglish: false,
      getQuotesGenerated: () => 0,
      actorUserId: null,
      requestContext,
    });

    await expect(readStream(stream)).resolves.toEqual([]);
    expect(errorSpy).not.toHaveBeenCalledWith('Stream error:', expect.anything());
    logSpy.mockRestore();
  });

  it('swallows usage recorder failures but still closes the stream', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(recordUsageEvent).mockRejectedValueOnce(new Error('usage failed'));
    vi.mocked(recordQuoteEvent).mockRejectedValueOnce(new Error('quote failed'));

    const stream = createChatResponseStream({
      result: {
        fullStream: createAsyncIterable([{ type: 'text-delta', text: 'hola' }]),
        totalUsage: Promise.resolve({
          inputTokens: 1,
          outputTokens: 2,
          totalTokens: 3,
        }),
      },
      username: 'jose',
      modelName: 'gemini-flash-latest',
      locale: 'es',
      sessionId: null,
      isEnglish: false,
      getQuotesGenerated: () => 1,
      actorUserId: null,
      requestContext,
      onPrivateFlowUsageRecorded: vi.fn().mockRejectedValue(new Error('private failed')),
    });

    await expect(readStream(stream)).resolves.toHaveLength(1);
    expect(errorSpy).toHaveBeenCalledWith('Usage tracking error:', expect.any(Error));
    expect(errorSpy).toHaveBeenCalledWith('Quote usage tracking error:', expect.any(Error));
    expect(errorSpy).toHaveBeenCalledWith(
      'Private flow usage tracking error:',
      expect.any(Error)
    );
  });
});
