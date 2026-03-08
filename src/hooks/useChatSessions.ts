import { useEffect, useState, useSyncExternalStore } from 'react';
import { AppLocale, normalizeLocale } from '@/lib/i18n';
import {
  ChatMessage,
  ChatSession,
  ChatToolMessage,
  createChatSession,
  getActiveChatSessionId,
  getChatSessions,
  saveActiveChatSessionId,
  saveChatSessions,
} from '@/lib/chatHistory';
import { getCompatStorageItem, setCompatStorageItem } from '@/lib/browser-storage';
import {
  LOCALE_STORAGE_KEY,
  LEGACY_LOCALE_STORAGE_KEYS,
  MAX_CHAT_SESSIONS,
  deriveSessionTitle,
} from '../components/chat/chat-constants';

interface ChatSessionsState {
  sessions: ChatSession[];
  activeSessionId: string;
  messages: ChatMessage[];
  toolMessages: ChatToolMessage[];
  closedTools: Set<string>;
  locale: AppLocale;
}

function resolveInitialChatState(initialLocale: AppLocale): ChatSessionsState {
  if (typeof window === 'undefined') {
    const fallbackSession = createChatSession(initialLocale);

    return {
      sessions: [fallbackSession],
      activeSessionId: fallbackSession.id,
      messages: fallbackSession.messages,
      toolMessages: fallbackSession.toolMessages,
      closedTools: new Set(fallbackSession.closedToolIds),
      locale: initialLocale,
    };
  }

  const storedLocale = getCompatStorageItem(
    localStorage,
    LOCALE_STORAGE_KEY,
    LEGACY_LOCALE_STORAGE_KEYS
  );
  const defaultLocale = normalizeLocale(storedLocale) || initialLocale;
  const storedSessions = getChatSessions();
  const storedActiveSessionId = getActiveChatSessionId();
  const initialSession =
    storedSessions.find((session) => session.id === storedActiveSessionId) ??
    storedSessions[0] ??
    createChatSession(defaultLocale);

  return {
    sessions: storedSessions.length > 0 ? storedSessions : [initialSession],
    activeSessionId: initialSession.id,
    messages: initialSession.messages,
    toolMessages: initialSession.toolMessages,
    closedTools: new Set(initialSession.closedToolIds),
    locale: initialSession.locale ?? defaultLocale,
  };
}

function syncActiveSession(state: ChatSessionsState): ChatSessionsState {
  if (!state.activeSessionId) {
    return state;
  }

  const updatedAt = Date.now();
  const closedToolIds = Array.from(state.closedTools);
  const existing = state.sessions.find((session) => session.id === state.activeSessionId);
  const baseSession = existing ?? createChatSession(state.locale);
  const updatedSession: ChatSession = {
    ...baseSession,
    id: state.activeSessionId,
    title:
      state.messages.length > 0
        ? deriveSessionTitle(state.messages, state.locale)
        : baseSession.title,
    locale: state.locale,
    updatedAt,
    messages: state.messages,
    toolMessages: state.toolMessages,
    closedToolIds,
  };
  const nextSessions = existing
    ? state.sessions.map((session) =>
        session.id === state.activeSessionId ? updatedSession : session
      )
    : [updatedSession, ...state.sessions];

  return {
    ...state,
    sessions: nextSessions
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .slice(0, MAX_CHAT_SESSIONS),
  };
}

function applyStateUpdate<T>(currentValue: T, nextValue: React.SetStateAction<T>): T {
  return typeof nextValue === 'function'
    ? (nextValue as (value: T) => T)(currentValue)
    : nextValue;
}

function persistLocale(nextLocale: AppLocale) {
  setCompatStorageItem(
    localStorage,
    LOCALE_STORAGE_KEY,
    nextLocale,
    LEGACY_LOCALE_STORAGE_KEYS
  );
  document.cookie = `app_locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
}

export function useChatSessions(initialLocale: AppLocale) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [state, setState] = useState<ChatSessionsState>(() => resolveInitialChatState(initialLocale));

  useEffect(() => {
    if (!mounted) {
      return;
    }

    saveChatSessions(state.sessions);
  }, [mounted, state.sessions]);

  useEffect(() => {
    if (!mounted || !state.activeSessionId) {
      return;
    }

    saveActiveChatSessionId(state.activeSessionId);
  }, [mounted, state.activeSessionId]);

  const setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>> = (nextMessages) => {
    setState((prevState) =>
      syncActiveSession({
        ...prevState,
        messages: applyStateUpdate(prevState.messages, nextMessages),
      })
    );
  };

  const setToolMessages: React.Dispatch<React.SetStateAction<ChatToolMessage[]>> = (
    nextToolMessages
  ) => {
    setState((prevState) =>
      syncActiveSession({
        ...prevState,
        toolMessages: applyStateUpdate(prevState.toolMessages, nextToolMessages),
      })
    );
  };

  const changeLocale = (nextLocale: AppLocale) => {
    persistLocale(nextLocale);
    setState((prevState) =>
      syncActiveSession({
        ...prevState,
        locale: nextLocale,
      })
    );
  };

  const startNewConversation = () => {
    setState((prevState) => {
      const newSession = createChatSession(prevState.locale);

      return {
        ...prevState,
        sessions: [newSession, ...prevState.sessions].slice(0, MAX_CHAT_SESSIONS),
        activeSessionId: newSession.id,
        messages: [],
        toolMessages: [],
        closedTools: new Set(),
      };
    });
  };

  const switchConversation = (sessionId: string) => {
    const session = state.sessions.find((item) => item.id === sessionId);
    if (!session) {
      return;
    }

    if (session.locale !== state.locale) {
      persistLocale(session.locale);
    }

    setState((prevState) => ({
      ...prevState,
      activeSessionId: session.id,
      messages: session.messages,
      toolMessages: session.toolMessages,
      closedTools: new Set(session.closedToolIds),
      locale: session.locale,
    }));
  };

  const deleteConversation = (sessionId: string) => {
    const remainingSessions = state.sessions.filter((session) => session.id !== sessionId);
    const nextActiveSession =
      sessionId === state.activeSessionId ? remainingSessions[0] ?? null : null;

    if (nextActiveSession && nextActiveSession.locale !== state.locale) {
      persistLocale(nextActiveSession.locale);
    }

    setState((prevState) => {
      const nextSessions = prevState.sessions.filter((session) => session.id !== sessionId);

      if (nextSessions.length === 0) {
        const fallback = createChatSession(prevState.locale);
        return {
          ...prevState,
          sessions: [fallback],
          activeSessionId: fallback.id,
          messages: [],
          toolMessages: [],
          closedTools: new Set(),
        };
      }

      if (sessionId !== prevState.activeSessionId) {
        return {
          ...prevState,
          sessions: nextSessions,
        };
      }

      const nextSession = nextSessions[0];
      return {
        ...prevState,
        sessions: nextSessions,
        activeSessionId: nextSession.id,
        messages: nextSession.messages,
        toolMessages: nextSession.toolMessages,
        closedTools: new Set(nextSession.closedToolIds),
        locale: nextSession.locale,
      };
    });
  };

  const handleRemoveCard = (toolId: string) => {
    setState((prevState) =>
      syncActiveSession({
        ...prevState,
        closedTools: new Set([...prevState.closedTools, toolId]),
      })
    );
  };

  return {
    mounted,
    sessions: state.sessions,
    activeSessionId: state.activeSessionId,
    messages: state.messages,
    setMessages,
    toolMessages: state.toolMessages,
    setToolMessages,
    closedTools: state.closedTools,
    locale: state.locale,
    changeLocale,
    startNewConversation,
    switchConversation,
    deleteConversation,
    handleRemoveCard,
  };
}
