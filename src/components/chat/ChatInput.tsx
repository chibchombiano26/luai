'use client';

import { useRef, useEffect, useState } from 'react';
import { Send, Mic, MicOff, Square } from 'lucide-react';
import { AppLocale } from '@/lib/i18n';
import { SlashCommandMenu } from './SlashCommandMenu';
import { SlashCommandSelection } from '@/lib/chat/types';
import { ChatCommandId } from '@/lib/chat/commands';
import { CHAT_COPY, MAX_INPUT_LINES } from './chat-constants';

interface ChatInputProps {
  input: string;
  setInput: (text: string) => void;
  isLoading: boolean;
  onCancelRequest?: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isInputComposing: boolean;
  onInputCompositionStart: () => void;
  onInputCompositionEnd: () => void;
  pendingAutoSubmit: { text: string; secondsLeft: number } | null;
  onCancelAutoSubmit: () => void;
  locale: AppLocale;
  onSelectCommand: (command: SlashCommandSelection) => void;
  onVoiceInputReady: (text: string) => void;
  enabledCommandIds?: ChatCommandId[];
}

interface SpeechRecognitionResultItemLike {
  transcript?: string;
}

interface SpeechRecognitionAlternativeListLike {
  [index: number]: SpeechRecognitionResultItemLike | undefined;
  length: number;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionAlternativeListLike>;
}

interface SpeechRecognitionErrorEventLike {
  error?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
};

export function ChatInput({
  input,
  setInput,
  isLoading,
  onCancelRequest,
  onSubmit,
  onKeyDown,
  isInputComposing,
  onInputCompositionStart,
  onInputCompositionEnd,
  pendingAutoSubmit,
  onCancelAutoSubmit,
  locale,
  onSelectCommand,
  onVoiceInputReady,
  enabledCommandIds,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const baseInputRef = useRef('');
  const latestSetInputRef = useRef(setInput);
  const latestVoiceInputReadyRef = useRef(onVoiceInputReady);
  const latestVoiceInputRef = useRef('');
  const hasVoiceResultRef = useRef(false);
  const suppressVoiceAutoSubmitOnEndRef = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const t = CHAT_COPY[locale];
  const speechLang = locale === 'en' ? 'en-US' : 'es-CO';
  const speechWindow = typeof window !== 'undefined' ? (window as WindowWithSpeechRecognition) : null;
  const recognitionCtor = speechWindow?.SpeechRecognition ?? speechWindow?.webkitSpeechRecognition;
  const voiceSupported = Boolean(recognitionCtor);

  useEffect(() => {
    latestSetInputRef.current = setInput;
  }, [setInput]);

  useEffect(() => {
    latestVoiceInputReadyRef.current = onVoiceInputReady;
  }, [onVoiceInputReady]);

  useEffect(() => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = 'auto';
    const lineH = 20;
    const padding = 24;
    const maxH = lineH * MAX_INPUT_LINES + padding;
    const nextH = Math.min(el.scrollHeight, maxH);
    el.style.height = `${nextH}px`;
    el.style.overflowY = el.scrollHeight > maxH ? 'auto' : 'hidden';
  }, [input]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!recognitionCtor) {
      recognitionRef.current = null;
      return;
    }

    const recognition = new recognitionCtor();
    recognition.lang = speechLang;
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => {
          const alternative = result[0];
          return typeof alternative?.transcript === 'string' ? alternative.transcript : '';
        })
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      const baseInput = baseInputRef.current;
      const nextInput = transcript ? (baseInput ? `${baseInput} ${transcript}` : transcript) : baseInput;
      latestVoiceInputRef.current = nextInput;
      if (transcript) {
        hasVoiceResultRef.current = true;
      }
      latestSetInputRef.current(nextInput);
    };

    recognition.onerror = () => {
      setIsListening(false);
      hasVoiceResultRef.current = false;
      setVoiceError(t.voiceError);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (suppressVoiceAutoSubmitOnEndRef.current) {
        suppressVoiceAutoSubmitOnEndRef.current = false;
        hasVoiceResultRef.current = false;
        return;
      }

      if (hasVoiceResultRef.current) {
        const nextInput = latestVoiceInputRef.current.trim();
        if (nextInput) {
          latestVoiceInputReadyRef.current(nextInput);
        }
      }
      hasVoiceResultRef.current = false;
    };

    recognitionRef.current = recognition;

    return () => {
      suppressVoiceAutoSubmitOnEndRef.current = true;
      try {
        recognition.stop();
      } catch {
        // Ignore stop errors during cleanup.
      }
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognitionRef.current = null;
      setIsListening(false);
    };
  }, [recognitionCtor, speechLang, t.voiceError]);

  const handleVoiceToggle = () => {
    if (!voiceSupported || !recognitionRef.current) {
      setVoiceError(t.voiceError);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      return;
    }

    baseInputRef.current = input.trim();
    latestVoiceInputRef.current = baseInputRef.current;
    hasVoiceResultRef.current = false;
    suppressVoiceAutoSubmitOnEndRef.current = false;
    setVoiceError(null);

    try {
      recognitionRef.current.lang = speechLang;
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
      setVoiceError(t.voiceError);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (isListening) {
      suppressVoiceAutoSubmitOnEndRef.current = true;
      recognitionRef.current?.stop();
    }
    onSubmit(e);
  };

  return (
    <div className="sticky bottom-0 p-3 md:p-6 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:pb-6 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
      {pendingAutoSubmit && !isLoading && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-900 dark:text-amber-200" data-testid="auto-submit-banner">
          <span>{t.autoSubmitIn(pendingAutoSubmit.secondsLeft)}</span>
          <button type="button" onClick={onCancelAutoSubmit} className="rounded border border-amber-300/80 dark:border-amber-800 px-2 py-1 text-[11px] font-medium">
            {t.cancelAutoSubmit}
          </button>
        </div>
      )}

      {isListening && !isLoading && (
        <div className="mb-2 text-xs text-blue-700 dark:text-blue-300" data-testid="voice-listening-indicator">
          {t.voiceListening}
        </div>
      )}

      {voiceError && !isLoading && (
        <div className="mb-2 text-xs text-rose-700 dark:text-rose-300" data-testid="voice-input-error">
          {voiceError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            rows={1}
            className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 text-sm leading-5 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white resize-none"
            value={input}
            placeholder={t.placeholder}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            onCompositionStart={onInputCompositionStart}
            onCompositionEnd={onInputCompositionEnd}
            disabled={isLoading}
          />
          <SlashCommandMenu
            input={input}
            onSelectCommand={onSelectCommand}
            locale={locale}
            enabledCommandIds={enabledCommandIds}
          />
        </div>
        {voiceSupported && (
          <button
            type="button"
            onClick={handleVoiceToggle}
            disabled={isLoading || isInputComposing}
            aria-label={isListening ? t.voiceStop : t.voiceStart}
            title={isListening ? t.voiceStop : t.voiceStart}
            data-testid="voice-input-button"
            className={`p-3 rounded-xl transition-colors disabled:opacity-50 ${
              isListening
                ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-200'
                : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100'
            }`}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        )}
        {isLoading && (
          <button
            type="button"
            onClick={onCancelRequest}
            aria-label={t.stopRequest}
            title={t.stopRequest}
            data-testid="stop-request-button"
            className="rounded-xl border border-zinc-300 bg-zinc-100 p-3 text-zinc-700 transition-colors hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            <Square className="w-5 h-5" />
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading || isInputComposing}
          className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
