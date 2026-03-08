import { useState, useCallback, useRef } from 'react';
import { AppLocale } from '@/lib/i18n';
import { ChatMessage, ChatToolMessage, normalizeChatToolType } from '@/lib/chatHistory';
import { ChatCommandId, resolveSlashCommandInput } from '@/lib/chat/commands';
import {
  asRecord,
  buildCommandMessage,
  CHAT_COPY,
} from '../components/chat/chat-constants';

const AUTH_REQUIRED_ERROR = 'AUTH_REQUIRED';

/** Inputs required by the chat streaming controller hook. */
export interface UseChatStreamProps {
  locale: AppLocale;
  activeSessionId: string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  toolMessages: ChatToolMessage[];
  setToolMessages: React.Dispatch<React.SetStateAction<ChatToolMessage[]>>;
  enabledCommandIds?: readonly ChatCommandId[];
}

export function useChatStream({
  locale,
  activeSessionId,
  messages,
  setMessages,
  toolMessages,
  setToolMessages,
  enabledCommandIds,
}: UseChatStreamProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasStreamingText, setHasStreamingText] = useState(false);
  const [apiProgressMessage, setApiProgressMessage] = useState<string | null>(null);
  const activeRequestAbortControllerRef = useRef<AbortController | null>(null);
  const t = CHAT_COPY[locale];

  const cancelCurrentRequest = useCallback(() => {
    const controller = activeRequestAbortControllerRef.current;
    if (!controller) return;
    controller.abort();
    activeRequestAbortControllerRef.current = null;
    setIsLoading(false);
    setHasStreamingText(false);
    setApiProgressMessage(null);
  }, []);

  const submitCurrentMessage = useCallback(async (input: string, pendingSlashCommandId: string | null) => {
    const slashCommand = resolveSlashCommandInput(input, locale, enabledCommandIds);
    const selectedCommandId = slashCommand?.id ?? pendingSlashCommandId;
    const userInput = (
      slashCommand
        ? buildCommandMessage(slashCommand.prompt, slashCommand.remainder)
        : input
    ).trim();

    if (isLoading || !userInput) return;

    setIsLoading(true);
    setHasStreamingText(false);
    setApiProgressMessage(null);

    const abortController = new AbortController();
    activeRequestAbortControllerRef.current = abortController;

    try {

      // Add user message locally
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: userInput,
        timestamp: Date.now(),
      };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      // Call API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          locale,
          sessionId: activeSessionId,
          commandId: selectedCommandId,
          hasQuoteContext: toolMessages.some(
            (tm) =>
              tm.type === 'quote' ||
              tm.type === 'comparison'
          ),
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        let errorMessage = '';
        try {
          const errorBody = (await response.json()) as { message?: string };
          if (typeof errorBody.message === 'string') {
            errorMessage = errorBody.message;
          }
        } catch { /* ignore */ }
        if (response.status === 401) {
          throw new Error(AUTH_REQUIRED_ERROR);
        }
        throw new Error(errorMessage || `API error: ${response.status}`);
      }
      
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const assistantMessageId = `assistant_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const assistantTimestamp = Date.now();
      let assistantText = '';
      let buffer = '';

      const upsertAssistantMessage = (nextText: string) => {
        setMessages((prev) => {
          const idx = prev.findIndex((m) => m.id === assistantMessageId);
          if (idx === -1) {
            return [
              ...prev,
              { id: assistantMessageId, role: 'assistant', content: nextText, timestamp: assistantTimestamp },
            ];
          }
          const next = [...prev];
          next[idx] = { ...next[idx], content: nextText };
          return next;
        });
      };

      const handleStreamLine = (rawLine: string) => {
        const trimmed = rawLine.trim();
        if (!trimmed || trimmed === 'data: [DONE]') return;
        const payload = trimmed.startsWith('data:') ? trimmed.slice(5).trim() : trimmed;
        if (!payload) return;

        try {
          const data = JSON.parse(payload);
          if (data.type === 'text' && typeof data.content === 'string') {
            assistantText += data.content;
            setHasStreamingText(true);
            upsertAssistantMessage(assistantText);
          } else if (data.type === 'tool' && typeof data.toolType === 'string') {
            const nextToolType = normalizeChatToolType(data.toolType);
            if (!nextToolType) {
              return;
            }
            const nextToolData = asRecord(data.data);
            const nextTool = {
              id: `tool_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              type: nextToolType,
              data: nextToolData as ChatToolMessage['data'],
              timestamp: Date.now(),
            } as unknown as ChatToolMessage;
            setToolMessages((prev) => [...prev, nextTool]);
          } else if (data.type === 'status') {
            if (data.status === 'start') {
              setApiProgressMessage(data.message || t.apiLookupInProgress);
            } else if (data.status === 'end') {
              setApiProgressMessage(null);
            }
          }
        } catch (e) {
          console.error('SSE Parse Error:', e);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) handleStreamLine(line);
      }
      if (buffer.trim()) handleStreamLine(buffer);

    } catch (error) {
      if (
        (error instanceof DOMException && error.name === 'AbortError') ||
        (error instanceof Error &&
          (error.name === 'AbortError' || error.name === 'CanceledError'))
      ) {
        return;
      }

      if (error instanceof Error && error.message === AUTH_REQUIRED_ERROR) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: 'assistant', content: t.authRequired, timestamp: Date.now() },
        ]);
        return;
      }

      console.error('Chat stream error:', error);
      const msg = error instanceof Error && error.message && !error.message.startsWith('API error:')
        ? error.message
        : t.errorProcessing;
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: msg, timestamp: Date.now() },
      ]);
    } finally {
      if (activeRequestAbortControllerRef.current === abortController) {
        activeRequestAbortControllerRef.current = null;
        setIsLoading(false);
        setHasStreamingText(false);
        setApiProgressMessage(null);
      }
    }
  }, [locale, activeSessionId, messages, setMessages, toolMessages, setToolMessages, isLoading, t.apiLookupInProgress, t.authRequired, t.errorProcessing, enabledCommandIds]);

  return {
    isLoading,
    hasStreamingText,
    apiProgressMessage,
    submitCurrentMessage,
    cancelCurrentRequest,
  };
}
