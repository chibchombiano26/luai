import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useChatSessions } from './useChatSessions';
import type { ChatSession } from '@/lib/chatHistory';

const chatHistoryMocks = vi.hoisted(() => {
  const createChatSession = vi.fn();
  const getActiveChatSessionId = vi.fn();
  const getChatSessions = vi.fn();
  const saveActiveChatSessionId = vi.fn();
  const saveChatSessions = vi.fn();

  return {
    createChatSession,
    getActiveChatSessionId,
    getChatSessions,
    saveActiveChatSessionId,
    saveChatSessions,
  };
});

vi.mock('@/lib/chatHistory', () => ({
  createChatSession: chatHistoryMocks.createChatSession,
  getActiveChatSessionId: chatHistoryMocks.getActiveChatSessionId,
  getChatSessions: chatHistoryMocks.getChatSessions,
  saveActiveChatSessionId: chatHistoryMocks.saveActiveChatSessionId,
  saveChatSessions: chatHistoryMocks.saveChatSessions,
}));

function makeSession(overrides: Partial<ChatSession> = {}): ChatSession {
  return {
    id: 'session-1',
    title: 'Hola mundo',
    locale: 'es',
    messages: [],
    toolMessages: [],
    closedToolIds: [],
    updatedAt: 100,
    ...overrides,
  };
}

describe('useChatSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.cookie = '';
  });

  it('bootstraps from active stored session and persists updates', async () => {
    const active = makeSession({
      id: 'session-2',
      locale: 'en',
      messages: [{ id: 'm1', role: 'user', content: 'hi', timestamp: 1 }],
      closedToolIds: ['tool-1'],
    });
    chatHistoryMocks.getChatSessions.mockReturnValue([makeSession(), active]);
    chatHistoryMocks.getActiveChatSessionId.mockReturnValue('session-2');
    chatHistoryMocks.createChatSession.mockReturnValue(makeSession({ id: 'new-session' }));
    localStorage.setItem('luai_locale', 'es');

    const { result } = renderHook(() => useChatSessions('es'));

    await waitFor(() => expect(result.current.mounted).toBe(true));

    expect(result.current.locale).toBe('en');
    expect(result.current.activeSessionId).toBe('session-2');
    expect(result.current.messages).toEqual(active.messages);
    expect(result.current.closedTools).toEqual(new Set(['tool-1']));

    act(() => {
      result.current.setMessages([{ id: 'm2', role: 'user', content: 'updated', timestamp: 2 }]);
    });

    await waitFor(() => {
      expect(chatHistoryMocks.saveChatSessions).toHaveBeenCalled();
      expect(chatHistoryMocks.saveActiveChatSessionId).toHaveBeenCalledWith('session-2');
    });
  });

  it('creates a fallback session when storage is empty and starts new conversations', async () => {
    const fallback = makeSession({ id: 'fallback', locale: 'es', title: 'Nueva conversacion' });
    const second = makeSession({ id: 'second', locale: 'es', title: 'Segunda' });
    chatHistoryMocks.getChatSessions.mockReturnValue([]);
    chatHistoryMocks.getActiveChatSessionId.mockReturnValue(null);
    chatHistoryMocks.createChatSession
      .mockReturnValueOnce(fallback)
      .mockReturnValueOnce(second);

    const { result } = renderHook(() => useChatSessions('es'));

    await waitFor(() => expect(result.current.activeSessionId).toBe('fallback'));
    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.sessions[0]).toEqual(
      expect.objectContaining({
        id: 'fallback',
        locale: 'es',
      })
    );

    act(() => {
      result.current.startNewConversation();
    });

    expect(result.current.activeSessionId).toBe('second');
    expect(result.current.messages).toEqual([]);
    expect(result.current.toolMessages).toEqual([]);
    expect(result.current.closedTools).toEqual(new Set());
  });

  it('switches and deletes conversations with locale changes and fallback replacement', async () => {
    const first = makeSession({ id: 'session-1', locale: 'es' });
    const second = makeSession({
      id: 'session-2',
      locale: 'en',
      messages: [{ id: 'm2', role: 'assistant', content: 'hello', timestamp: 2 }],
      toolMessages: [{ id: 'tool-2', timestamp: 2, type: 'error', data: { message: 'boom' } }],
      closedToolIds: ['tool-2'],
      updatedAt: 200,
    });
    const fallback = makeSession({ id: 'fallback', locale: 'en' });
    chatHistoryMocks.getChatSessions.mockReturnValue([first, second]);
    chatHistoryMocks.getActiveChatSessionId.mockReturnValue('session-1');
    chatHistoryMocks.createChatSession.mockReturnValue(fallback);

    const { result } = renderHook(() => useChatSessions('es'));

    await waitFor(() => expect(result.current.activeSessionId).toBe('session-1'));

    act(() => {
      result.current.switchConversation('session-2');
    });

    expect(result.current.activeSessionId).toBe('session-2');
    expect(result.current.locale).toBe('en');
    expect(document.cookie).toContain('app_locale=en');

    act(() => {
      result.current.deleteConversation('session-1');
    });
    expect(result.current.activeSessionId).toBe('session-2');

    await waitFor(() => {
      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0].id).toBe('session-2');
    });

    act(() => {
      result.current.deleteConversation('session-2');
    });

    await waitFor(() => {
      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0]).toEqual(
        expect.objectContaining({
          id: 'fallback',
          locale: 'en',
        })
      );
      expect(result.current.activeSessionId).toBe('fallback');
    });
  });

  it('ignores missing session ids and tracks removed tool cards', async () => {
    const session = makeSession({ id: 'session-1', locale: 'es' });
    chatHistoryMocks.getChatSessions.mockReturnValue([session]);
    chatHistoryMocks.getActiveChatSessionId.mockReturnValue('session-1');
    chatHistoryMocks.createChatSession.mockReturnValue(makeSession({ id: 'fallback' }));

    const { result } = renderHook(() => useChatSessions('es'));

    await waitFor(() => expect(result.current.activeSessionId).toBe('session-1'));

    act(() => {
      result.current.switchConversation('missing');
      result.current.handleRemoveCard('tool-99');
    });

    expect(result.current.activeSessionId).toBe('session-1');
    expect(result.current.closedTools).toEqual(new Set(['tool-99']));
  });
});
