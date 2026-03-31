import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ChatTimeline } from './ChatTimeline';
import type { ChatMessage, ChatToolMessage } from '@/lib/chatHistory';

function createBaseProps() {
  return {
    messages: [] as ChatMessage[],
    toolMessages: [] as ChatToolMessage[],
    closedTools: new Set<string>(),
    isLoading: false,
    hasStreamingText: false,
    apiProgressMessage: null,
    locale: 'es' as const,
    onRemoveCard: vi.fn(),
    onFormSubmit: vi.fn().mockResolvedValue(undefined),
  };
}

function createMessage(
  overrides: Partial<ChatMessage> & Pick<ChatMessage, 'id' | 'content' | 'timestamp'>
): ChatMessage {
  return {
    role: 'assistant',
    ...overrides,
  };
}

function createToolMessage(message: ChatToolMessage): ChatToolMessage {
  return message;
}

describe('ChatTimeline', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('renders empty state without sample-data shortcuts', () => {
    const props = createBaseProps();
    render(<ChatTimeline {...props} />);

    expect(screen.getByText(/¡hola! soy tu asistente\./i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /usar datos de ejemplo/i })).not.toBeInTheDocument();
  });

  it('renders messages and tool cards in chronological order while filtering closed tools', () => {
    const props = createBaseProps();
    props.messages = [
      createMessage({ id: 'assistant-1', content: 'assistant late', timestamp: 30 }),
      createMessage({ id: 'user-1', role: 'user', content: 'user early', timestamp: 10 }),
    ];
    props.toolMessages = [
      createToolMessage({
        id: 'tool-visible',
        timestamp: 20,
        type: 'error',
        data: { message: 'tool middle' },
      }),
      createToolMessage({
        id: 'tool-hidden',
        timestamp: 25,
        type: 'error',
        data: { message: 'should stay hidden' },
      }),
    ];
    props.closedTools = new Set(['tool-hidden']);

    render(<ChatTimeline {...props} />);

    const user = screen.getByText('user early');
    const tool = screen.getByText('tool middle');
    const assistant = screen.getByText('assistant late');

    expect(
      user.compareDocumentPosition(tool) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      tool.compareDocumentPosition(assistant) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(screen.queryByText('should stay hidden')).not.toBeInTheDocument();
  });

  it('renders dynamic flow cards using fallback wrapper and localized title', () => {
    const props = createBaseProps();
    props.toolMessages = [
      createToolMessage({
        id: 'dynamic-1',
        timestamp: 1,
        type: 'dynamic_card',
        data: {
          title: 'Resumen del flujo',
          description: 'Descripción generada',
          message: 'Mensaje principal',
          details: [{ label: 'Campo', value: 'Valor' }],
        },
      }),
    ];

    render(<ChatTimeline {...props} />);

    expect(screen.getByText('Resumen del flujo')).toBeInTheDocument();
    expect(screen.getByText('Descripción generada')).toBeInTheDocument();
    expect(screen.getByText('Mensaje principal')).toBeInTheDocument();
    expect(screen.getByText('Valor')).toBeInTheDocument();
  });

  it('renders fallback summary copy and removes dynamic cards', async () => {
    const props = createBaseProps();
    props.toolMessages = [
      createToolMessage({
        id: 'dynamic-2',
        timestamp: 2,
        type: 'dynamic_card',
        data: {
          title: 'Resultado alterno',
          details: [],
        },
      }),
    ];

    render(<ChatTimeline {...props} />);

    expect(screen.getByText('Sin resumen disponible.')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Eliminar'));
    expect(props.onRemoveCard).toHaveBeenCalledWith('dynamic-2');
  });

  it('renders flow-pack tool components when a renderer is registered', () => {
    const props = createBaseProps();
    props.toolMessages = [
      createToolMessage({
        id: 'weather-1',
        timestamp: 1,
        type: 'weather_forecast',
        data: {
          locationName: 'Bogota',
          timezone: 'America/Bogota',
          units: 'metric',
          summary: 'Clima en Bogota',
          current: {
            time: '2026-03-05T12:00',
            weatherCode: 3,
            weatherLabel: 'Nublado',
            temperature: 19,
            apparentTemperature: 18,
            windSpeed: 11,
          },
          daily: [],
        },
      }),
    ];

    render(<ChatTimeline {...props} />);

    expect(screen.getByText('Bogota')).toBeInTheDocument();
    expect(screen.getByText('Clima en Bogota')).toBeInTheDocument();
  });

  it('renders plain error tool messages without wrappers', () => {
    const props = createBaseProps();
    props.toolMessages = [
      createToolMessage({
        id: 'error-1',
        timestamp: 3,
        type: 'error',
        data: {
          message: 'Fallo al consultar el flujo',
        },
      }),
    ];

    render(<ChatTimeline {...props} />);

    expect(screen.getByText('Fallo al consultar el flujo')).toBeInTheDocument();
  });

  it('hides visible BBVA form payloads from user bubbles', () => {
    const props = createBaseProps();
    props.messages = [
      createMessage({
        id: 'user-bbva-1',
        role: 'user',
        timestamp: 1,
        content:
          'He completado las coberturas de la cotización BBVA. BBVA_FORM:coverages:{"rceIncludesProducts":true,"mgcLimit":5000000}',
      }),
    ];

    render(<ChatTimeline {...props} />);

    expect(
      screen.getByText('He completado las coberturas de la cotización BBVA.')
    ).toBeInTheDocument();
    expect(screen.queryByText(/BBVA_FORM:coverages:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/"mgcLimit":5000000/)).not.toBeInTheDocument();
  });

  it('truncates oversized chat messages before they break the layout', () => {
    const props = createBaseProps();
    const longMessage = `prefijo-${'x'.repeat(220)}`;
    props.messages = [
      createMessage({
        id: 'assistant-long-1',
        timestamp: 1,
        content: longMessage,
      }),
    ];

    render(<ChatTimeline {...props} />);

    const bubble = screen.getByText(new RegExp(`^prefijo-x{20}`));
    expect(bubble.textContent?.endsWith('…')).toBe(true);
    expect(bubble.textContent && bubble.textContent.length).toBeLessThan(longMessage.length);
    expect(screen.queryByText(longMessage)).not.toBeInTheDocument();
  });

  it('shows typing and API progress indicators only when applicable', async () => {
    const props = createBaseProps();
    const { rerender } = render(
      <ChatTimeline
        {...props}
        isLoading
        hasStreamingText={false}
        apiProgressMessage="Consultando..."
      />
    );

    expect(screen.getByTestId('assistant-typing-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('api-progress-indicator')).toBeInTheDocument();
    expect(screen.getByText('Consultando...')).toBeInTheDocument();

    rerender(
      <ChatTimeline
        {...props}
        isLoading
        hasStreamingText
        apiProgressMessage={null}
      />
    );

    await waitFor(() => {
      expect(screen.queryByTestId('assistant-typing-indicator')).not.toBeInTheDocument();
      expect(screen.queryByTestId('api-progress-indicator')).not.toBeInTheDocument();
    });
  });
});
