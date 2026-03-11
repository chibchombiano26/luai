import type { ToolSet } from 'ai';
import type { ToolContext } from '@/app/api/chat/agent-tools-types';
import type { ChatRequestContext } from '@/app/api/chat/parser';
import type { AppLocale } from '@/lib/i18n';

export type PackToolFactory = (context: ToolContext) => ToolSet[string];

export interface FlowPackLocalizedText {
  es: string;
  en: string;
}

export interface FlowPackToolStreamFeedback {
  startStatusMessage?: FlowPackLocalizedText;
  startTextMessage?: FlowPackLocalizedText;
}

export interface FlowPackChatRuntimeContext {
  requestContext: ChatRequestContext;
  enabledCardIds: ReadonlySet<string>;
  cardConfigById: Record<string, Record<string, unknown>>;
  abortSignal?: AbortSignal;
  forcedToolId: string | null;
  actorUserId?: string | null;
  username: string;
}

export interface FlowPackChatRuntimeResult {
  earlyResponse?: Response | null;
  toolContext?: Partial<ToolContext>;
  streamFeedbackByToolId?: Record<string, FlowPackToolStreamFeedback>;
  allowedToolIds?: string[];
}

export interface FlowPackChatModule {
  resolveRuntime?: (
    context: FlowPackChatRuntimeContext
  ) => Promise<FlowPackChatRuntimeResult | null | undefined> | FlowPackChatRuntimeResult | null | undefined;
  streamFeedbackByToolId?: Record<string, FlowPackToolStreamFeedback>;
  recordUsage?: (context: FlowPackUsageRecordContext) => Promise<void> | void;
}

export interface FlowPackUsageRecordContext {
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
}

export interface FlowPackServerModule {
  tools?: Partial<Record<string, PackToolFactory>>;
  chat?: FlowPackChatModule;
}
