import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { getFreeTierStatusForUser } from '@/lib/profile/usage';
import { isClerkAuthEnabled } from '@/lib/auth';
import { resolveAiProviderApiKey } from '@/lib/ai-providers';
import { buildSystemPrompt } from './prompts';
import {
  buildSlashCommandToolInstruction,
  jsonLineStream,
} from './host-utils';
import { getAgentTools } from './agent-tools';
import { getHostTranslation } from './host-messages';
import { parseChatRequest } from './parser';
import { resolveFlowPackChatRuntime } from './flow-pack-runtime';
import { createChatResponseStream } from './streaming';
import { ChatBackendToolId, COMMAND_TO_BACKEND_TOOL } from '@/lib/chat/commands';
import { getFlowCardSettings } from '@/lib/platform/settings';
import { toEnabledFlowCardIdSet, toFlowCardConfigById } from '@/lib/platform/cards';
import { getSlashCommandIdsForEnabledCards } from '@/lib/platform/slash-commands';
import { ensureCurrentClerkUserAccess } from '@/lib/access/clerk-user';

type ResolvedClerkIdentity = {
  userId: string;
  username: string;
};

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

function shouldBypassFreeTierLimit(username: string): boolean {
  const normalizedUsername = username.trim().toLowerCase();
  if (!normalizedUsername) return false;

  const bypassUsers = new Set<string>();
  const basicAuthUser = process.env.BASIC_AUTH_USERNAME?.trim().toLowerCase();
  if (basicAuthUser) {
    bypassUsers.add(basicAuthUser);
  }

  const explicitBypassUsers = (process.env.FREE_TIER_BYPASS_USERNAMES ?? '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  for (const user of explicitBypassUsers) {
    bypassUsers.add(user);
  }

  return bypassUsers.has(normalizedUsername);
}

export async function POST(req: Request) {
  try {
    const abortSignal = req.signal;
    const flowCardSettings = await getFlowCardSettings();
    const enabledCardIds = toEnabledFlowCardIdSet(flowCardSettings);
    const cardConfigById = toFlowCardConfigById(flowCardSettings);
    const enabledCommandIds = getSlashCommandIdsForEnabledCards(enabledCardIds, cardConfigById);
    const context = await parseChatRequest(req, { enabledCommandIds });
    let resolvedUsername: string | null = null;
    let resolvedUserId: string | null = null;
    if (isClerkAuthEnabled()) {
      const headerUsername = context.username !== 'anonymous' ? context.username : null;
      let clerkIdentity: ResolvedClerkIdentity | null = null;
      try {
        const resolvedIdentity = await ensureCurrentClerkUserAccess();
        clerkIdentity = resolvedIdentity
          ? {
              userId: resolvedIdentity.userId,
              username: resolvedIdentity.username,
            }
          : null;
      } catch (error) {
        console.error('Clerk auth resolution failed in /api/chat:', error);
      }
      resolvedUsername = clerkIdentity?.username ?? headerUsername;
      resolvedUserId = clerkIdentity?.userId ?? null;
      if (!resolvedUsername) {
        return new Response(
          JSON.stringify({ error: 'UNAUTHORIZED', message: 'Authentication required' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const { isEnglish, locale, messages, sessionId } = context;
    const username = resolvedUsername ?? context.username;
    if (enabledCardIds.size === 0) {
        return new Response(
        jsonLineStream([{ type: 'text', content: getHostTranslation('NO_ACTIVE_FLOWS', isEnglish) }]),
        { headers: { 'Content-Type': 'text/event-stream' } }
      );
    }

    const forcedToolId = context.slashCommandId
      ? (COMMAND_TO_BACKEND_TOOL[context.slashCommandId] as ChatBackendToolId)
      : null;
    const flowPackRuntime = await resolveFlowPackChatRuntime({
      requestContext: context,
      enabledCardIds,
      cardConfigById,
      abortSignal,
      forcedToolId,
      actorUserId: resolvedUserId,
      username,
    });

    if (flowPackRuntime.earlyResponse) {
      return flowPackRuntime.earlyResponse;
    }

    // 3. AI SDK Configuration
    const apiKey = await resolveAiProviderApiKey('gemini');
    const modelName = 'gemini-flash-latest';
    let quotesGeneratedCount = 0;

    if (!apiKey) {
      console.error('❌ Gemini API key is missing');
      return new Response(JSON.stringify({ error: 'AI Config Error' }), { status: 500 });
    }
    const googleProvider = createGoogleGenerativeAI({ apiKey });

    const freeTierStatus = await getFreeTierStatusForUser(username);
    const bypassFreeTierLimit = shouldBypassFreeTierLimit(username);
    if (freeTierStatus.isLimited && !bypassFreeTierLimit) {
      const message = getHostTranslation('FREE_TIER_LIMIT_REACHED', isEnglish);
      return new Response(
        JSON.stringify({ error: 'FREE_TIER_LIMIT_REACHED', message, limits: freeTierStatus }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const slashToolInstruction = forcedToolId
      ? buildSlashCommandToolInstruction(forcedToolId as ChatBackendToolId, isEnglish)
      : '';
    const baseSystemPrompt = buildSystemPrompt({ locale, enabledCardIds, cardConfigById });
    const systemPrompt = slashToolInstruction
      ? `${baseSystemPrompt}\n\n${slashToolInstruction}`
      : baseSystemPrompt;

    const result = streamText({
      model: googleProvider(modelName),
      messages,
      system: systemPrompt,
      abortSignal,
      tools: getAgentTools(
        {
          isEnglish,
          detectedPlate: flowPackRuntime.toolContext.detectedPlate ?? null,
          abortSignal,
          actorUserId: resolvedUserId,
          enabledCardIds,
          cardConfigById,
          enabledComparisonProviderCodes: flowPackRuntime.toolContext.enabledComparisonProviderCodes,
          enabledSingleProviderCodes: flowPackRuntime.toolContext.enabledSingleProviderCodes,
          onQuoteGenerated: () => {
            quotesGeneratedCount += 1;
          },
        },
        {
          allowedToolIds: flowPackRuntime.allowedToolIds,
        }
      ),
    });

    // 4. Transform AI SDK stream to custom format
    const responseStream = createChatResponseStream({
      result,
      username,
      modelName,
      locale,
      sessionId,
      actorUserId: resolvedUserId,
      requestContext: context,
      isEnglish,
      getQuotesGenerated: () => quotesGeneratedCount,
      toolStreamFeedbackById: flowPackRuntime.streamFeedbackByToolId,
      onPrivateFlowUsageRecorded:
        (flowPackRuntime.usageRecorders?.length ?? 0) > 0
          ? async (usageRecord) => {
              for (const recordUsage of flowPackRuntime.usageRecorders ?? []) {
                await recordUsage(usageRecord);
              }
            }
          : undefined,
    });

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    if (isAbortError(error)) {
      return new Response(null, { status: 499 });
    }
    console.error('Chat API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Error processing request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
