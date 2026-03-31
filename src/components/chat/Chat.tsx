'use client';

import type { ReactNode } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { usePayloadOverrides } from '@/hooks/usePayloadOverrides';
import { useTheme } from '@/hooks/useTheme';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useChatStream } from '@/hooks/useChatStream';
import type { AppLocale } from '@/lib/i18n';
import type { ProfileAvatarSettings } from '@/lib/profile/types';
import { ChatHeader } from './ChatHeader';
import { ChatTimeline } from './ChatTimeline';
import { ChatInput } from './ChatInput';
import {
  AUTO_SUBMIT_DELAY_SECONDS,
  VOICE_AUTO_SUBMIT_DELAY_SECONDS,
} from './chat-constants';
import { getCommandPrompt } from '@/lib/chat/commands';
import { ChatCommandId } from '@/lib/chat/commands';
import { FLOW_CARD_DEFINITIONS, isFlowCardId, type FlowCardId } from '@/lib/platform/cards';
import { getSlashCommandIdsForEnabledCards } from '@/lib/platform/slash-commands';

const DEFAULT_AVATAR_SETTINGS: ProfileAvatarSettings = {
  globalAssistantPreset: 'default',
  assistant: {
    mode: 'default',
    imageUrl: null,
  },
  user: {
    mode: 'default',
    imageUrl: null,
  },
};

const DEFAULT_ENABLED_COMMAND_IDS = getSlashCommandIdsForEnabledCards(
  FLOW_CARD_DEFINITIONS.filter((card) => card.defaultEnabled).map((card) => card.id)
);

export function Chat({
  clerkEnabled = false,
  trailingAccessory,
  onLocaleChange,
  headerAccessory,
}: {
  clerkEnabled?: boolean;
  trailingAccessory?: ReactNode;
  onLocaleChange?: (locale: AppLocale) => void;
  headerAccessory?: ReactNode;
}) {
  const { getOverrides } = usePayloadOverrides();
  const { theme, accentTheme, toggleTheme, setAccentTheme, mounted: themeMounted } = useTheme();
  
  const {
    mounted,
    sessions,
    activeSessionId,
    messages,
    setMessages,
    toolMessages,
    setToolMessages,
    closedTools,
    locale,
    changeLocale,
    startNewConversation,
    switchConversation,
    deleteConversation,
    handleRemoveCard,
  } = useChatSessions('es');

  const [input, setInput] = useState('');
  const [pendingSlashCommandId, setPendingSlashCommandId] = useState<string | null>(null);
  const [pendingAutoSubmit, setPendingAutoSubmit] = useState<{ text: string; secondsLeft: number } | null>(null);
  const [isInputComposing, setIsInputComposing] = useState(false);
  const [enabledCommandIds, setEnabledCommandIds] = useState<ChatCommandId[]>(
    DEFAULT_ENABLED_COMMAND_IDS
  );
  const [avatarSettings, setAvatarSettings] = useState<ProfileAvatarSettings>(
    DEFAULT_AVATAR_SETTINGS
  );

  useEffect(() => {
    onLocaleChange?.(locale);
  }, [locale, onLocaleChange]);

  const {
    isLoading,
    hasStreamingText,
    apiProgressMessage,
    submitCurrentMessage,
    cancelCurrentRequest,
  } = useChatStream({
    locale,
    activeSessionId,
    messages,
    setMessages,
    toolMessages,
    setToolMessages,
    enabledCommandIds,
  });

  useEffect(() => {
    let cancelled = false;

    const loadEnabledCommands = async () => {
      try {
        const response = await fetch('/api/platform/cards');
        if (!response.ok) {
          if (!cancelled) {
            setEnabledCommandIds(DEFAULT_ENABLED_COMMAND_IDS);
          }
          return;
        }

        const payload = (await response.json()) as {
          cards?: Array<{ id?: unknown; config?: unknown; enabled?: unknown }>;
        };
        const cards = Array.isArray(payload.cards) ? payload.cards : [];
        const cardConfigById = cards.reduce<Record<string, Record<string, unknown>>>((acc, rawCard) => {
          if (!rawCard || typeof rawCard !== 'object') {
            return acc;
          }
          const card = rawCard as { id?: unknown; config?: unknown };
          if (typeof card.id !== 'string') {
            return acc;
          }
          if (!card.config || typeof card.config !== 'object' || Array.isArray(card.config)) {
            return acc;
          }
          acc[card.id] = card.config as Record<string, unknown>;
          return acc;
        }, {});
        const enabledCardIds = cards.reduce<FlowCardId[]>((acc, rawCard) => {
          if (!rawCard || typeof rawCard !== 'object') {
            return acc;
          }
          const card = rawCard as { id?: unknown; enabled?: unknown };
          if (card.enabled === true && isFlowCardId(card.id)) {
            acc.push(card.id);
          }
          return acc;
        }, []);

        if (!cancelled) {
          setEnabledCommandIds(getSlashCommandIdsForEnabledCards(enabledCardIds, cardConfigById));
        }
      } catch {
        if (!cancelled) {
          setEnabledCommandIds(DEFAULT_ENABLED_COMMAND_IDS);
        }
      }
    };

    void loadEnabledCommands();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAvatarSettings = async () => {
      try {
        const response = await fetch('/api/profile', {
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          avatarSettings?: ProfileAvatarSettings;
        };

        if (!cancelled && payload.avatarSettings) {
          setAvatarSettings(payload.avatarSettings);
        }
      } catch {
        // Chat can fall back to default icons when profile preferences are unavailable.
      }
    };

    void loadAvatarSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  // Overrides detection
  const hasOverrides = useMemo(() => {
    const overrides = getOverrides();
    return !!(overrides && Object.keys(overrides).length > 0);
  }, [getOverrides]);

  // Auto-submit timer
  useEffect(() => {
    if (!pendingAutoSubmit || isLoading) return;
    if (pendingAutoSubmit.secondsLeft <= 0) {
      const submitText = pendingAutoSubmit.text;
      const submitTimerId = setTimeout(() => {
        setInput('');
        setPendingSlashCommandId(null);
        void submitCurrentMessage(submitText, null);
        setPendingAutoSubmit(null);
      }, 0);
      return () => clearTimeout(submitTimerId);
    }
    const timerId = setTimeout(() => {
      setPendingAutoSubmit(prev => prev ? { ...prev, secondsLeft: prev.secondsLeft - 1 } : null);
    }, 1000);
    return () => clearTimeout(timerId);
  }, [pendingAutoSubmit, isLoading, submitCurrentMessage]);

  const handleFormSubmit = async (text: string) => {
    setInput(text);
    setPendingSlashCommandId(null);
    setPendingAutoSubmit({ text, secondsLeft: AUTO_SUBMIT_DELAY_SECONDS });
  };

  const handleVoiceInputReady = (text: string) => {
    const normalized = text.trim();
    if (!normalized) return;
    setInput(normalized);
    setPendingSlashCommandId(null);
    setPendingAutoSubmit({ text: normalized, secondsLeft: VOICE_AUTO_SUBMIT_DELAY_SECONDS });
  };

  const handleManualSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isInputComposing) return;
    setPendingAutoSubmit(null);
    const currentInput = input;
    setInput('');
    await submitCurrentMessage(currentInput, pendingSlashCommandId);
    setPendingSlashCommandId(null);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isInputComposing && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void handleManualSubmit();
    }
  };

  if (!mounted) {
    return (
      <div className="h-[100dvh] min-h-[100svh] md:min-h-0 md:!h-[80vh] w-full max-w-2xl mx-auto bg-zinc-50 dark:bg-zinc-950 rounded-none md:rounded-3xl border-x-0 md:border border-zinc-200 dark:border-zinc-800 shadow-none md:shadow-2xl flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">Cargando chat...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] min-h-[100svh] md:min-h-0 md:!h-[80vh] w-full max-w-2xl mx-auto bg-zinc-50 dark:bg-zinc-950 rounded-none md:rounded-3xl overflow-hidden border-x-0 md:border border-zinc-200 dark:border-zinc-800 shadow-none md:shadow-2xl">
      <ChatHeader
        clerkEnabled={clerkEnabled}
        locale={locale}
        changeLocale={changeLocale}
        sessions={sessions}
        activeSessionId={activeSessionId}
        switchConversation={switchConversation}
        deleteConversation={deleteConversation}
        startNewConversation={startNewConversation}
        hasOverrides={hasOverrides}
        accentTheme={accentTheme}
        setAccentTheme={setAccentTheme}
        theme={theme}
        toggleTheme={toggleTheme}
        themeMounted={themeMounted}
        showNewChatButton={messages.length > 0 || toolMessages.length > 0}
        headerAccessory={headerAccessory}
      />

      <ChatTimeline
        messages={messages}
        toolMessages={toolMessages}
        closedTools={closedTools}
        isLoading={isLoading}
        hasStreamingText={hasStreamingText}
        apiProgressMessage={apiProgressMessage}
        locale={locale}
        assistantAvatarUrl={avatarSettings.assistant.imageUrl}
        userAvatarUrl={avatarSettings.user.imageUrl}
        onRemoveCard={handleRemoveCard}
        onFormSubmit={handleFormSubmit}
      />

      <ChatInput
        input={input}
        setInput={(text) => {
          if (pendingAutoSubmit) setPendingAutoSubmit(null);
          setInput(text);
          setPendingSlashCommandId(null);
        }}
        isLoading={isLoading}
        onCancelRequest={cancelCurrentRequest}
        onSubmit={handleManualSubmit}
        onKeyDown={handleInputKeyDown}
        isInputComposing={isInputComposing}
        onInputCompositionStart={() => setIsInputComposing(true)}
        onInputCompositionEnd={() => setIsInputComposing(false)}
        pendingAutoSubmit={pendingAutoSubmit}
        onCancelAutoSubmit={() => setPendingAutoSubmit(null)}
        locale={locale}
        onSelectCommand={(cmd) => {
          const prompt = getCommandPrompt(cmd.id as ChatCommandId, locale);
          setInput(prompt);
          setPendingSlashCommandId(cmd.id);
        }}
        onVoiceInputReady={handleVoiceInputReady}
        enabledCommandIds={enabledCommandIds}
        trailingAccessory={trailingAccessory}
      />
    </div>
  );
}
