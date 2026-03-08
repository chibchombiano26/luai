'use client';

import { useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ChatMessage, ChatToolMessage } from '@/lib/chatHistory';
import { AppLocale } from '@/lib/i18n';
import { ToolCardWrapper } from './ToolCardWrapper';
import { GENERATED_FLOW_PACK_UI_MODULES } from '@/lib/platform/generated-flow-pack-ui';
import { resolveFlowPackToolRenderer } from '@/lib/platform/pack-ui';
import { CHAT_COPY } from './chat-constants';
import { DynamicFlowCard } from '../cards/DynamicFlowCard';
import { AvatarBadge } from '../avatar/AvatarBadge';

const FLOW_PACK_TOOL_RENDERERS = Object.values(GENERATED_FLOW_PACK_UI_MODULES).flatMap(
  (module) => module.renderers ?? []
);

function resolveToolResultTitle(toolMsg: ChatToolMessage, locale: AppLocale): string {
  if (toolMsg.type === 'dynamic_card' && typeof toolMsg.data.title === 'string') {
    return toolMsg.data.title;
  }

  return locale === 'es' ? 'Resultado de flujo' : 'Flow result';
}

interface ChatTimelineProps {
  messages: ChatMessage[];
  toolMessages: ChatToolMessage[];
  closedTools: Set<string>;
  isLoading: boolean;
  hasStreamingText: boolean;
  apiProgressMessage: string | null;
  locale: AppLocale;
  assistantAvatarUrl?: string | null;
  userAvatarUrl?: string | null;
  onRemoveCard: (id: string) => void;
  onFormSubmit: (text: string) => Promise<void>;
}

export function ChatTimeline({
  messages,
  toolMessages,
  closedTools,
  isLoading,
  hasStreamingText,
  apiProgressMessage,
  locale,
  assistantAvatarUrl,
  userAvatarUrl,
  onRemoveCard,
  onFormSubmit,
}: ChatTimelineProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = CHAT_COPY[locale];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, toolMessages, isLoading, apiProgressMessage]);

  const timelineItems = [
    ...messages.map((m) => ({ id: m.id, timestamp: m.timestamp, type: 'message' as const, data: m })),
    ...toolMessages
      .filter((tm) => !closedTools.has(tm.id))
      .map((tm) => ({ id: tm.id, timestamp: tm.timestamp, type: 'tool' as const, data: tm })),
  ].sort((a, b) => a.timestamp - b.timestamp);

  const renderToolComponent = (toolMsg: ChatToolMessage) => {
    const handleFormSubmit = async (text: string) => await onFormSubmit(text);

    const commonProps = {
      onRemove: () => onRemoveCard(toolMsg.id),
    };

    const packRenderer = resolveFlowPackToolRenderer(FLOW_PACK_TOOL_RENDERERS, toolMsg);
    if (packRenderer) {
      const title = packRenderer.titleByLocale?.[locale] ?? resolveToolResultTitle(toolMsg, locale);
      const Component = packRenderer.Component;
      return (
        <ToolCardWrapper key={toolMsg.id} {...commonProps} title={title}>
          <Component
            toolMessage={toolMsg}
            locale={locale}
            onRemove={commonProps.onRemove}
            onFormSubmit={handleFormSubmit}
          />
        </ToolCardWrapper>
      );
    }

    switch (toolMsg.type) {
      case 'error':
        return (
          <div key={toolMsg.id} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-red-700 dark:text-red-400">{toolMsg.data.message}</p>
          </div>
        );
      case 'dynamic_card':
        return (
          <ToolCardWrapper
            key={toolMsg.id}
            {...commonProps}
            title={resolveToolResultTitle(toolMsg, locale)}
          >
            <DynamicFlowCard
              title={resolveToolResultTitle(toolMsg, locale)}
              description={typeof toolMsg.data.description === 'string' ? toolMsg.data.description : undefined}
              message={typeof toolMsg.data.message === 'string' ? toolMsg.data.message : undefined}
              details={Array.isArray(toolMsg.data.details) ? toolMsg.data.details : undefined}
              locale={locale}
            />
          </ToolCardWrapper>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain p-3 md:p-6 space-y-4 md:space-y-6">
      {messages.length === 0 && toolMessages.length === 0 && !isLoading && (
        <div className="flex items-center justify-center h-full text-center">
          <div className="text-zinc-400 space-y-4">
            <div>
              <AvatarBadge
                role="assistant"
                imageUrl={assistantAvatarUrl}
                size="xl"
                className="mx-auto mb-4"
              />
              <p className="text-sm mb-2">{t.emptyTitle}</p>
              <p className="text-xs">{t.emptySubtitle}</p>
            </div>
          </div>
        </div>
      )}

      {timelineItems.map((item) => (
        <div key={item.id} className={`flex ${item.type === 'message' && (item.data as ChatMessage).role === 'user' ? 'justify-end' : 'justify-start'}`}>
          {item.type === 'message' ? (
            <div className={`max-w-[90%] md:max-w-[85%] flex gap-2 md:gap-3 ${(item.data as ChatMessage).role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <AvatarBadge
                role={(item.data as ChatMessage).role === 'user' ? 'user' : 'assistant'}
                imageUrl={
                  (item.data as ChatMessage).role === 'user'
                    ? userAvatarUrl
                    : assistantAvatarUrl
                }
                size="sm"
                className="flex-shrink-0"
              />
              <div className={`p-4 rounded-2xl text-sm ${(item.data as ChatMessage).role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-tl-none dark:text-zinc-300'}`}>
                {(item.data as ChatMessage).content}
              </div>
            </div>
          ) : (
            <div className="max-w-[95%] sm:max-w-[85%] w-full">{renderToolComponent(item.data as ChatToolMessage)}</div>
          )}
        </div>
      ))}

      {isLoading && !hasStreamingText && (
        <div className="flex justify-start" data-testid="assistant-typing-indicator">
          <div className="flex gap-3">
            <AvatarBadge role="assistant" imageUrl={assistantAvatarUrl} size="sm" />
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl rounded-tl-none">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading && apiProgressMessage && (
        <div className="flex justify-start" data-testid="api-progress-indicator">
          <div className="max-w-[90%] md:max-w-[85%] flex gap-2 md:gap-3">
            <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-4 h-4 text-sky-600 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl text-sm bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 rounded-tl-none">
              {apiProgressMessage}
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
