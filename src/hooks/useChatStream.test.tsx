import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useChatStream } from './useChatStream';

describe('useChatStream', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('surfaces auth errors in chat without redirecting away from the current page', async () => {
    const setMessages = vi.fn();
    const setToolMessages = vi.fn();

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Authentication required' }),
      })
    );

    const { result } = renderHook(() =>
      useChatStream({
        locale: 'es',
        activeSessionId: 'session-1',
        messages: [],
        setMessages,
        toolMessages: [],
        setToolMessages,
        enabledCommandIds: [],
      })
    );

    await act(async () => {
      await result.current.submitCurrentMessage('hola', null);
    });

    await waitFor(() => {
      expect(setMessages).toHaveBeenCalledTimes(2);
    });

    expect(setMessages.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        role: 'user',
        content: 'hola',
      }),
    ]);

    const appendAuthMessage = setMessages.mock.calls[1][0] as (
      messages: Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: number }>
    ) => Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: number }>;

    expect(
      appendAuthMessage([
        { id: 'user-1', role: 'user', content: 'hola', timestamp: 1 },
      ])
    ).toEqual([
      { id: 'user-1', role: 'user', content: 'hola', timestamp: 1 },
      expect.objectContaining({
        role: 'assistant',
        content: 'Tu sesión no está disponible. Inicia sesión nuevamente desde el botón de acceso.',
      }),
    ]);
  });

  it('uses the latest message history even when an older submit callback is invoked', async () => {
    const setMessages = vi.fn();
    const setToolMessages = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
        }),
      },
    });
    vi.stubGlobal('fetch', fetchMock);

    const initialMessages = [
      { id: 'm1', role: 'user' as const, content: 'hola', timestamp: 1 },
      { id: 'm2', role: 'assistant' as const, content: 'respuesta 1', timestamp: 2 },
    ];
    const latestMessages = [
      ...initialMessages,
      { id: 'm3', role: 'user' as const, content: 'segunda', timestamp: 3 },
      { id: 'm4', role: 'assistant' as const, content: 'respuesta 2', timestamp: 4 },
    ];

    const { result, rerender } = renderHook(
      ({ messages }: { messages: typeof initialMessages }) =>
        useChatStream({
          locale: 'es',
          activeSessionId: 'session-1',
          messages,
          setMessages,
          toolMessages: [],
          setToolMessages,
          enabledCommandIds: [],
        }),
      {
        initialProps: { messages: initialMessages },
      }
    );

    const staleSubmit = result.current.submitCurrentMessage;

    rerender({ messages: latestMessages });

    await act(async () => {
      await staleSubmit('tercera', null);
    });

    expect(setMessages).toHaveBeenCalledWith([
      ...latestMessages,
      expect.objectContaining({
        role: 'user',
        content: 'tercera',
      }),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string) as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    };
    expect(requestBody.messages).toEqual([
      { role: 'user', content: 'hola' },
      { role: 'assistant', content: 'respuesta 1' },
      { role: 'user', content: 'segunda' },
      { role: 'assistant', content: 'respuesta 2' },
      { role: 'user', content: 'tercera' },
    ]);
  });

  it('preserves past market cards but replaces duplicate market results from the current turn', async () => {
    const setMessages = vi.fn();
    const setToolMessages = vi.fn();
    let now = 100;
    vi.spyOn(Date, 'now').mockImplementation(() => now++);

    const chunks = [
      'data: {"type":"tool","toolType":"dynamic_card","data":{"cardId":"market_asset_lookup","title":"Gold"}}\n',
      'data: {"type":"tool","toolType":"dynamic_card","data":{"cardId":"market_asset_lookup","title":"Bitcoin"}}\n',
    ];

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => {
            let index = 0;
            return {
              read: vi.fn().mockImplementation(async () => {
                if (index >= chunks.length) {
                  return { done: true, value: undefined };
                }

                const value = new TextEncoder().encode(chunks[index]);
                index += 1;
                return { done: false, value };
              }),
            };
          },
        },
      })
    );

    const { result } = renderHook(() =>
      useChatStream({
        locale: 'es',
        activeSessionId: 'session-1',
        messages: [],
        setMessages,
        toolMessages: [],
        setToolMessages,
        enabledCommandIds: [],
      })
    );

    await act(async () => {
      await result.current.submitCurrentMessage('bitcoin', null);
    });

    const replaceMarketCard = setToolMessages.mock.calls.at(-1)?.[0] as
      | ((toolMessages: Array<{ type: string; data: Record<string, unknown> }>) => unknown)
      | undefined;

    expect(replaceMarketCard).toBeTypeOf('function');
    expect(
      replaceMarketCard?.([
        {
          id: 'tool-gold-previous-turn',
          type: 'dynamic_card',
          data: { cardId: 'market_asset_lookup', title: 'Gold' },
          timestamp: 1,
        },
        {
          id: 'tool-gold-current-turn',
          type: 'dynamic_card',
          data: { cardId: 'market_asset_lookup', title: 'Gold' },
          timestamp: 102,
        },
      ])
    ).toEqual([
      expect.objectContaining({
        id: 'tool-gold-previous-turn',
        type: 'dynamic_card',
        data: expect.objectContaining({
          cardId: 'market_asset_lookup',
          title: 'Gold',
        }),
      }),
      expect.objectContaining({
        type: 'dynamic_card',
        data: expect.objectContaining({
          cardId: 'market_asset_lookup',
          title: 'Bitcoin',
        }),
      }),
    ]);
  });

  it('replaces duplicate pokemon cards from the current turn using card metadata', async () => {
    const setMessages = vi.fn();
    const setToolMessages = vi.fn();
    let now = 200;
    vi.spyOn(Date, 'now').mockImplementation(() => now++);

    const chunks = [
      'data: {"type":"tool","toolType":"dynamic_card","data":{"cardId":"pokemon_lookup","title":"Pikachu"}}\n',
      'data: {"type":"tool","toolType":"dynamic_card","data":{"cardId":"pokemon_lookup","title":"Charizard"}}\n',
    ];

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        body: {
          getReader: () => {
            let index = 0;
            return {
              read: vi.fn().mockImplementation(async () => {
                if (index >= chunks.length) {
                  return { done: true, value: undefined };
                }

                const value = new TextEncoder().encode(chunks[index]);
                index += 1;
                return { done: false, value };
              }),
            };
          },
        },
      })
    );

    const { result } = renderHook(() =>
      useChatStream({
        locale: 'es',
        activeSessionId: 'session-1',
        messages: [],
        setMessages,
        toolMessages: [],
        setToolMessages,
        enabledCommandIds: [],
      })
    );

    await act(async () => {
      await result.current.submitCurrentMessage('charizard', null);
    });

    const replacePokemonCard = setToolMessages.mock.calls.at(-1)?.[0] as
      | ((toolMessages: Array<{ type: string; data: Record<string, unknown>; timestamp: number; id: string }>) => unknown)
      | undefined;

    expect(
      replacePokemonCard?.([
        {
          id: 'tool-pikachu-previous-turn',
          type: 'dynamic_card',
          data: { cardId: 'pokemon_lookup', title: 'Pikachu' },
          timestamp: 1,
        },
        {
          id: 'tool-pikachu-current-turn',
          type: 'dynamic_card',
          data: { cardId: 'pokemon_lookup', title: 'Pikachu' },
          timestamp: 202,
        },
      ])
    ).toEqual([
      expect.objectContaining({
        id: 'tool-pikachu-previous-turn',
        data: expect.objectContaining({
          cardId: 'pokemon_lookup',
          title: 'Pikachu',
        }),
      }),
      expect.objectContaining({
        data: expect.objectContaining({
          cardId: 'pokemon_lookup',
          title: 'Charizard',
        }),
      }),
    ]);
  });
});
