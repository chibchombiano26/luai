import { recordQuoteEvent, recordUsageEvent } from '@/lib/profile/usage';
import { AppLocale } from '@/lib/i18n';
import type { LanguageModelUsage, TextStreamPart, ToolSet } from 'ai';
import type { FlowPackToolStreamFeedback } from '@/lib/platform/pack-server';
import type { ChatRequestContext } from './parser';
import { getHostTranslation } from './host-messages';

type ChatStreamResult<T extends ToolSet> = {
  fullStream: AsyncIterable<TextStreamPart<T>>;
  totalUsage: PromiseLike<LanguageModelUsage>;
};

interface StreamOptions<T extends ToolSet> {
  result: ChatStreamResult<T>;
  username: string;
  modelName: string;
  locale: AppLocale;
  sessionId: string | null;
  isEnglish: boolean;
  getQuotesGenerated: () => number;
  toolStreamFeedbackById?: Record<string, FlowPackToolStreamFeedback>;
  actorUserId?: string | null;
  requestContext: ChatRequestContext;
  onPrivateFlowUsageRecorded?: (input: {
    requestContext: ChatRequestContext;
    actorUserId?: string | null;
    username: string;
    locale: AppLocale;
    sessionId: string | null;
    modelName: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    quoteCount: number;
  }) => Promise<void>;
}

function isAbortError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const maybeError = error as { code?: unknown };
    if (maybeError.code === 'ERR_CANCELED') {
      return true;
    }
  }
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error &&
      (error.name === 'AbortError' || error.name === 'CanceledError'))
  );
}

export function createChatResponseStream<T extends ToolSet>({
  result,
  username,
  modelName,
  locale,
  sessionId,
  isEnglish,
  getQuotesGenerated,
  toolStreamFeedbackById = {},
  actorUserId,
  requestContext,
  onPrivateFlowUsageRecorded,
}: StreamOptions<T>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        console.log('📡 Starting stream sequence...');
        let eventCount = 0;
        let emittedPayloads = 0;
        const pendingToolFeedbackQueue: FlowPackToolStreamFeedback[] = [];

        for await (const event of result.fullStream) {
          console.log(`📦 Event ${eventCount + 1}:`, event.type);
          eventCount++;

          if (event.type === 'text-delta') {
            controller.enqueue(
              encoder.encode(JSON.stringify({ type: 'text', content: event.text }) + '\n')
            );
            emittedPayloads += 1;
          } else if (event.type === 'tool-call') {
            const toolName = event.toolName;
            const toolFeedback = toolStreamFeedbackById[toolName];

            if (toolFeedback) {
              pendingToolFeedbackQueue.push(toolFeedback);

              const locale = isEnglish ? 'en' : 'es';
              const startStatusMessage = toolFeedback.startStatusMessage?.[locale];
              const startTextMessage = toolFeedback.startTextMessage?.[locale];

              if (startStatusMessage) {
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      type: 'status',
                      status: 'start',
                      message: startStatusMessage,
                    }) + '\n'
                  )
                );
                emittedPayloads += 1;
              }

              if (startTextMessage) {
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      type: 'text',
                      content: startTextMessage,
                    }) + '\n'
                  )
                );
                emittedPayloads += 1;
              }
            }
          } else if (event.type === 'tool-result') {
            const toolResult = event.output as Record<string, unknown> & { type?: unknown };
            const toolType = typeof toolResult.type === 'string' ? toolResult.type : 'unknown';

            if (pendingToolFeedbackQueue.length > 0) {
              pendingToolFeedbackQueue.shift();
              controller.enqueue(
                encoder.encode(JSON.stringify({ type: 'status', status: 'end' }) + '\n')
              );
              emittedPayloads += 1;
            }

            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: 'tool',
                  toolType,
                  data: toolResult,
                }) + '\n'
              )
            );
            emittedPayloads += 1;
          }
        }

        while (pendingToolFeedbackQueue.length > 0) {
          pendingToolFeedbackQueue.shift();
          controller.enqueue(encoder.encode(JSON.stringify({ type: 'status', status: 'end' }) + '\n'));
          emittedPayloads += 1;
        }

        if (emittedPayloads === 0) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'text',
                content: getHostTranslation('FALLBACK_RESPONSE_ERROR', isEnglish),
              }) + '\n'
            )
          );
        }

        // Track usage and quotes
        let finalizedInputTokens = 0;
        let finalizedOutputTokens = 0;
        let finalizedTotalTokens = 0;
        const finalizedQuoteCount = getQuotesGenerated();

        try {
          const usage = await result.totalUsage;
          finalizedInputTokens = usage.inputTokens ?? 0;
          finalizedOutputTokens = usage.outputTokens ?? 0;
          finalizedTotalTokens = usage.totalTokens ?? 0;
          await recordUsageEvent({
            username,
            model: modelName,
            locale,
            sessionId,
            inputTokens: finalizedInputTokens,
            outputTokens: finalizedOutputTokens,
            totalTokens: finalizedTotalTokens,
          });
        } catch (error) {
          console.error('Usage tracking error:', error);
        }

        try {
          await recordQuoteEvent({
            username,
            model: modelName,
            locale,
            sessionId,
            quoteCount: finalizedQuoteCount,
          });
        } catch (error) {
          console.error('Quote usage tracking error:', error);
        }

        if (onPrivateFlowUsageRecorded) {
          try {
            await onPrivateFlowUsageRecorded({
              requestContext,
              actorUserId,
              username,
              locale,
              sessionId,
              modelName,
              inputTokens: finalizedInputTokens,
              outputTokens: finalizedOutputTokens,
              totalTokens: finalizedTotalTokens,
              quoteCount: finalizedQuoteCount,
            });
          } catch (error) {
            console.error('Private flow usage tracking error:', error);
          }
        }

        controller.close();
      } catch (error) {
        if (isAbortError(error)) {
          controller.close();
          return;
        }
        console.error('Stream error:', error);
        controller.error(error);
      }
    },
  });
}
