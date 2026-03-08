import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Chat } from './Chat';

const submitCurrentMessage = vi.fn();
const cancelCurrentRequest = vi.fn();
const getOverrides = vi.fn();
const sessionState = {
  mounted: true,
  sessions: [],
  activeSessionId: 'session-1',
  messages: [] as Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: number }>,
  setMessages: vi.fn(),
  toolMessages: [] as Array<unknown>,
  setToolMessages: vi.fn(),
  closedTools: new Set<string>(),
  locale: 'es' as const,
  changeLocale: vi.fn(),
  startNewConversation: vi.fn(),
  switchConversation: vi.fn(),
  deleteConversation: vi.fn(),
  handleRemoveCard: vi.fn(),
};

vi.mock('@/hooks/usePayloadOverrides', () => ({
  usePayloadOverrides: () => ({
    getOverrides,
  }),
}));

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    theme: 'light',
    accentTheme: 'blue',
    toggleTheme: vi.fn(),
    setAccentTheme: vi.fn(),
    mounted: true,
  }),
}));

vi.mock('@/hooks/useChatSessions', () => ({
  useChatSessions: () => sessionState,
}));

vi.mock('@/hooks/useChatStream', () => ({
  useChatStream: () => ({
    isLoading: false,
    hasStreamingText: false,
    apiProgressMessage: null,
    submitCurrentMessage,
    cancelCurrentRequest,
  }),
}));

vi.mock('./ChatHeader', () => ({
  ChatHeader: ({ showNewChatButton, hasOverrides, clerkEnabled }: { showNewChatButton: boolean; hasOverrides: boolean; clerkEnabled: boolean }) => (
    <div>
      <div data-testid="chat-header-show-new">{String(showNewChatButton)}</div>
      <div data-testid="chat-header-has-overrides">{String(hasOverrides)}</div>
      <div data-testid="chat-header-clerk-enabled">{String(clerkEnabled)}</div>
    </div>
  ),
}));

vi.mock('./ChatTimeline', () => ({
  ChatTimeline: ({
    onFormSubmit,
  }: {
    onFormSubmit: (text: string) => Promise<void>;
  }) => (
    <div>
      <button type="button" onClick={() => void onFormSubmit('form payload')}>
        timeline form submit
      </button>
    </div>
  ),
}));

vi.mock('./ChatInput', () => ({
  ChatInput: (props: {
    input: string;
    setInput: (text: string) => void;
    onSubmit: () => Promise<void>;
    onSelectCommand: (cmd: { id: string }) => void;
    onVoiceInputReady: (text: string) => void;
    onInputCompositionStart: () => void;
    onInputCompositionEnd: () => void;
    pendingAutoSubmit: { text: string; secondsLeft: number } | null;
    enabledCommandIds?: string[];
  }) => (
    <div>
      <div data-testid="chat-input-value">{props.input}</div>
      <div data-testid="chat-input-enabled-commands">
        {JSON.stringify(props.enabledCommandIds ?? null)}
      </div>
      <div data-testid="chat-input-pending-auto-submit">
        {props.pendingAutoSubmit ? `${props.pendingAutoSubmit.text}:${props.pendingAutoSubmit.secondsLeft}` : 'none'}
      </div>
      <button type="button" onClick={() => props.setInput('manual input')}>
        set manual input
      </button>
      <button type="button" onClick={() => props.onSelectCommand({ id: 'weather_forecast' })}>
        select command
      </button>
      <button type="button" onClick={() => props.onVoiceInputReady('   ')}>
        blank voice
      </button>
      <button type="button" onClick={() => props.onVoiceInputReady('  spoken text  ')}>
        valid voice
      </button>
      <button type="button" onClick={() => props.onInputCompositionStart()}>
        start composition
      </button>
      <button type="button" onClick={() => props.onInputCompositionEnd()}>
        end composition
      </button>
      <button type="button" onClick={() => void props.onSubmit()}>
        submit input
      </button>
    </div>
  ),
}));

describe('Chat container', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOverrides.mockReturnValue(null);
    Object.assign(sessionState, {
      mounted: true,
      sessions: [],
      activeSessionId: 'session-1',
      messages: [],
      toolMessages: [],
      closedTools: new Set<string>(),
      locale: 'es',
    });
  });

  it('renders loading shell when chat sessions are not mounted yet', () => {
    sessionState.mounted = false;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ cards: [] }),
      })
    );

    render(<Chat />);

    expect(screen.getByText(/cargando chat/i)).toBeInTheDocument();
  });

  it('falls back to default command ids when platform card loading fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
      })
    );

    render(<Chat />);

    await waitFor(() => {
      expect(screen.getByTestId('chat-input-enabled-commands')).not.toHaveTextContent('null');
    });
  });

  it('loads enabled commands from valid cards and ignores malformed entries', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          cards: [
            null,
            { id: 123, enabled: true, config: {} },
            { id: 'weather_forecast', enabled: true, config: { provider: 'open-meteo' } },
            { id: 'custom_card', enabled: true, config: {} },
          ],
        }),
      })
    );

    render(<Chat />);

    await waitFor(() => {
      expect(screen.getByTestId('chat-input-enabled-commands')).toHaveTextContent('weather_forecast');
    });
  });

  it('trims valid voice input and ignores blank voice transcripts', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ cards: [] }),
      })
    );

    render(<Chat />);

    fireEvent.click(screen.getByRole('button', { name: /blank voice/i }));
    expect(screen.getByTestId('chat-input-pending-auto-submit')).toHaveTextContent('none');

    fireEvent.click(screen.getByRole('button', { name: /valid voice/i }));

    await waitFor(() => {
      expect(screen.getByTestId('chat-input-value')).toHaveTextContent('spoken text');
      expect(screen.getByTestId('chat-input-pending-auto-submit')).toHaveTextContent('spoken text:5');
    });
  });

  it('blocks manual submit during composition and allows it again after composition ends', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ cards: [] }),
      })
    );

    render(<Chat />);

    fireEvent.click(screen.getByRole('button', { name: /set manual input/i }));
    fireEvent.click(screen.getByRole('button', { name: /start composition/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit input/i }));
    expect(submitCurrentMessage).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /end composition/i }));
    fireEvent.click(screen.getByRole('button', { name: /submit input/i }));

    await waitFor(() => {
      expect(submitCurrentMessage).toHaveBeenCalledWith('manual input', null);
    });
  });

  it('shows header flags for overrides and existing conversation content', async () => {
    getOverrides.mockReturnValue({ some: 'override' });
    sessionState.messages = [
      { id: 'm1', role: 'user', content: 'hola', timestamp: 1 },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ cards: [] }),
      })
    );

    render(<Chat />);

    expect(screen.getByTestId('chat-header-show-new')).toHaveTextContent('true');
    expect(screen.getByTestId('chat-header-has-overrides')).toHaveTextContent('true');
  });
});
