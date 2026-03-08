import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createChatSession,
  getActiveChatSessionId,
  getChatSessions,
  saveActiveChatSessionId,
  saveChatSessions,
} from './chatHistory';

describe('chatHistory', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('creates locale-aware chat sessions', () => {
    const esSession = createChatSession('es');
    const enSession = createChatSession('en');

    expect(esSession.id).toMatch(/^chat_/);
    expect(esSession.title).toBe('Nueva conversacion');
    expect(enSession.title).toBe('New conversation');
    expect(esSession.messages).toEqual([]);
    expect(esSession.toolMessages).toEqual([]);
    expect(esSession.closedToolIds).toEqual([]);
  });

  it('normalizes malformed stored sessions and sorts by updatedAt desc', () => {
    localStorage.setItem(
      'luai_chat_sessions_v1',
      JSON.stringify([
        {
          id: 'b',
          locale: 'en',
          createdAt: 20,
          updatedAt: 9999999999999,
          messages: [{ role: 'assistant', content: 'hello', timestamp: 1 }],
          toolMessages: [{ type: 'quote', data: { ok: true }, timestamp: 2 }],
          closedToolIds: ['x', 123],
        },
        {
          id: 'a',
          locale: 'es',
          createdAt: 'bad',
          messages: [{ role: 'invalid', content: 10, timestamp: 'bad' }],
          toolMessages: [{ type: 10, timestamp: 'bad' }],
          closedToolIds: ['y'],
        },
      ])
    );

    const sessions = getChatSessions();
    expect(sessions).toHaveLength(2);
    expect(sessions[0].id).toBe('b');
    expect(sessions[0].messages[0].role).toBe('assistant');
    expect(sessions[0].closedToolIds).toEqual(['x']);

    expect(sessions[1].id).toBe('a');
    expect(sessions[1].locale).toBe('es');
    expect(sessions[1].messages[0].role).toBe('user');
    expect(sessions[1].messages[0].content).toBe('');
    expect(sessions[1].toolMessages).toEqual([]);
  });

  it('returns empty sessions for invalid storage payloads', () => {
    localStorage.setItem('luai_chat_sessions_v1', '{"oops":');
    expect(getChatSessions()).toEqual([]);

    localStorage.setItem('luai_chat_sessions_v1', '{"not":"an-array"}');
    expect(getChatSessions()).toEqual([]);
  });

  it('normalizes non-array closedToolIds to empty array', () => {
    localStorage.setItem(
      'luai_chat_sessions_v1',
      JSON.stringify([
        {
          id: 'x',
          locale: 'es',
          createdAt: 1,
          updatedAt: 2,
          messages: [],
          toolMessages: [],
          closedToolIds: { invalid: true },
        },
      ])
    );

    expect(getChatSessions()[0].closedToolIds).toEqual([]);
  });

  it('normalizes non-array messages and toolMessages to empty arrays', () => {
    localStorage.setItem(
      'luai_chat_sessions_v1',
      JSON.stringify([
        {
          id: 'x',
          locale: 'es',
          createdAt: 1,
          updatedAt: 2,
          messages: { invalid: true },
          toolMessages: { invalid: true },
          closedToolIds: [],
        },
      ])
    );

    const session = getChatSessions()[0];
    expect(session.messages).toEqual([]);
    expect(session.toolMessages).toEqual([]);
  });

  it('saves sessions and active id', () => {
    const sessions = [createChatSession('es')];
    saveChatSessions(sessions);
    saveActiveChatSessionId('chat_123');

    expect(getChatSessions().length).toBe(1);
    expect(getActiveChatSessionId()).toBe('chat_123');
  });

  it('reads legacy chat session storage keys when new keys are missing', () => {
    localStorage.setItem(
      'legacy_chat_sessions_v1',
      JSON.stringify([createChatSession('es')])
    );
    localStorage.setItem('legacy_active_chat_session_id', 'legacy-session');

    expect(getChatSessions()).toHaveLength(1);
    expect(getActiveChatSessionId()).toBe('legacy-session');
    expect(localStorage.getItem('luai_chat_sessions_v1')).not.toBeNull();
    expect(localStorage.getItem('legacy_chat_sessions_v1')).toBeNull();
    expect(localStorage.getItem('luai_active_chat_session_id')).toBe('legacy-session');
    expect(localStorage.getItem('legacy_active_chat_session_id')).toBeNull();
  });

  it('normalizes legacy tool types into canonical neutral names', () => {
    localStorage.setItem(
      'luai_chat_sessions_v1',
      JSON.stringify([
        {
          id: 'legacy-tools',
          locale: 'es',
          createdAt: 1,
          updatedAt: 2,
          messages: [],
          toolMessages: [
            { id: 'tips', type: 'legacy_tips', data: { tips: [] }, timestamp: 1 },
            {
              id: 'calculator',
              type: 'legacy_calculator',
              data: { vehicleYear: 2020, vehiclePrice: 1, ratingZoneCode: 1 },
              timestamp: 2,
            },
          ],
          closedToolIds: [],
        },
      ])
    );

    expect(getChatSessions()[0].toolMessages).toEqual([
      { id: 'tips', type: 'guidance_tips', data: { tips: [] }, timestamp: 1 },
      {
        id: 'calculator',
        type: 'quote_calculator',
        data: { vehicleYear: 2020, vehiclePrice: 1, ratingZoneCode: 1 },
        timestamp: 2,
      },
    ]);
  });

  it('handles storage read/write failures gracefully', () => {
    const getSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const setSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(getChatSessions()).toEqual([]);
    expect(getActiveChatSessionId()).toBeNull();
    expect(() => saveChatSessions([createChatSession('es')])).not.toThrow();
    expect(() => saveActiveChatSessionId('chat_1')).not.toThrow();
    expect(getSpy).toHaveBeenCalled();
    expect(setSpy).toHaveBeenCalled();
  });

  it('returns early when window is not available', () => {
    vi.stubGlobal('window', undefined);

    expect(getChatSessions()).toEqual([]);
    expect(getActiveChatSessionId()).toBeNull();
    expect(() => saveChatSessions([createChatSession('es')])).not.toThrow();
    expect(() => saveActiveChatSessionId('chat_1')).not.toThrow();

    vi.unstubAllGlobals();
  });
});
