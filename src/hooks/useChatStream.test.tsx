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
});
