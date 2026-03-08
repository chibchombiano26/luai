import { normalizeLocale, AppLocale } from '@/lib/i18n';
import { getUsernameFromRequest } from '@/lib/auth';
import {
  getCommandPrompt,
  isChatCommandId,
  resolveSlashCommandInput,
  type ChatCommandId,
} from '@/lib/chat/commands';
import type { ChatApiMessage } from '@/lib/chat/types';
import { getLatestUserMessage, getLatestUserMessageIndex } from './host-utils';

export interface ChatRequestContext {
  rawMessages: ChatApiMessage[];
  messages: ChatApiMessage[];
  locale: AppLocale;
  isEnglish: boolean;
  sessionId: string | null;
  username: string;
  hasQuoteContext: boolean;
  explicitCommandId: ChatCommandId | null;
  lastUserMessageIndex: number;
  lastUserMessage: string;
  slashCommandId: ChatCommandId | null;
  normalizedLastUserMessage: string;
}

export interface ParseChatRequestOptions {
  enabledCommandIds?: readonly ChatCommandId[];
}

export async function parseChatRequest(
  req: Request,
  options: ParseChatRequestOptions = {}
): Promise<ChatRequestContext> {
  const body = await req.json();
  const rawMessages: ChatApiMessage[] = body.messages || [];
  const locale = normalizeLocale(body.locale);
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : null;
  const username = getUsernameFromRequest(req);
  const isEnglish = locale === 'en';
  const hasQuoteContext = body.hasQuoteContext === true;
  const explicitCommandId: ChatCommandId | null =
    isChatCommandId(body.commandId) &&
    (!options.enabledCommandIds || options.enabledCommandIds.includes(body.commandId))
      ? body.commandId
      : null;

  const lastUserMessageIndex = getLatestUserMessageIndex(rawMessages);
  const lastUserMessage = getLatestUserMessage(rawMessages);
  const inferredSlashCommand = resolveSlashCommandInput(
    lastUserMessage,
    locale,
    options.enabledCommandIds
  );
  const slashCommandId = explicitCommandId ?? inferredSlashCommand?.id ?? null;

  const normalizedLastUserMessage =
    slashCommandId && lastUserMessage.trim().startsWith('/')
      ? inferredSlashCommand
        ? `${inferredSlashCommand.prompt}${inferredSlashCommand.remainder ? `: ${inferredSlashCommand.remainder}` : ''}`
        : getCommandPrompt(slashCommandId, locale)
      : lastUserMessage;

  const messages =
    lastUserMessageIndex >= 0 && normalizedLastUserMessage !== lastUserMessage
      ? rawMessages.map((message, index) =>
          index === lastUserMessageIndex
            ? {
                ...message,
                content: normalizedLastUserMessage,
              }
            : message
        )
      : rawMessages;

  return {
    rawMessages,
    messages,
    locale,
    isEnglish,
    sessionId,
    username,
    hasQuoteContext,
    explicitCommandId,
    lastUserMessageIndex,
    lastUserMessage,
    slashCommandId,
    normalizedLastUserMessage,
  };
}
