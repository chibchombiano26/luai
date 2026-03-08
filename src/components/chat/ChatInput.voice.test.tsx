import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatInput } from './ChatInput';

class MockSpeechRecognition {
  static lastInstance: MockSpeechRecognition | null = null;

  lang = 'es-CO';
  interimResults = false;
  continuous = false;
  onresult: ((event: { results: ArrayLike<{ [index: number]: { transcript?: string } | undefined; length: number }> }) => void) | null = null;
  onerror: ((event: { error?: string }) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn(() => {
    this.onend?.();
  });

  constructor() {
    MockSpeechRecognition.lastInstance = this;
  }
}

function renderChatInput(
  input = '',
  setInput = vi.fn(),
  onVoiceInputReady = vi.fn()
) {
  return render(
    <ChatInput
      input={input}
      setInput={setInput}
      isLoading={false}
      onSubmit={vi.fn()}
      onKeyDown={vi.fn()}
      isInputComposing={false}
      onInputCompositionStart={vi.fn()}
      onInputCompositionEnd={vi.fn()}
      pendingAutoSubmit={null}
      onCancelAutoSubmit={vi.fn()}
      locale="es"
      onSelectCommand={vi.fn()}
      onVoiceInputReady={onVoiceInputReady}
    />
  );
}

describe('ChatInput voice dictation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    MockSpeechRecognition.lastInstance = null;
  });

  afterEach(() => {
    Reflect.deleteProperty(window as unknown as Record<string, unknown>, 'webkitSpeechRecognition');
    Reflect.deleteProperty(window as unknown as Record<string, unknown>, 'SpeechRecognition');
  });

  it('shows voice button and appends transcript when supported', async () => {
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      writable: true,
      value: MockSpeechRecognition,
    });

    const setInput = vi.fn();
    renderChatInput('Quiero', setInput);

    const voiceButton = await waitFor(() =>
      screen.getByRole('button', { name: /iniciar dictado por voz/i })
    );
    fireEvent.click(voiceButton);

    expect(MockSpeechRecognition.lastInstance).not.toBeNull();
    expect(MockSpeechRecognition.lastInstance?.start).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('voice-listening-indicator')).toBeInTheDocument();

    const results = [{ 0: { transcript: 'cotizar seguro' }, length: 1 }];
    act(() => {
      MockSpeechRecognition.lastInstance?.onresult?.({ results });
    });

    expect(setInput).toHaveBeenLastCalledWith('Quiero cotizar seguro');
  });

  it('notifies voice completion to start auto-submit flow', async () => {
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      writable: true,
      value: MockSpeechRecognition,
    });

    const setInput = vi.fn();
    const onVoiceInputReady = vi.fn();
    renderChatInput('Quiero', setInput, onVoiceInputReady);

    const voiceButton = await waitFor(() =>
      screen.getByRole('button', { name: /iniciar dictado por voz/i })
    );
    fireEvent.click(voiceButton);

    act(() => {
      MockSpeechRecognition.lastInstance?.onresult?.({
        results: [{ 0: { transcript: 'cotizar seguro' }, length: 1 }],
      });
      MockSpeechRecognition.lastInstance?.onend?.();
    });

    expect(onVoiceInputReady).toHaveBeenCalledWith('Quiero cotizar seguro');
  });

  it('hides voice button when speech recognition is not available', () => {
    renderChatInput();
    expect(screen.queryByTestId('voice-input-button')).not.toBeInTheDocument();
  });
});
