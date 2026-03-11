import { describe, expect, it } from 'vitest';
import { chat } from './index';

describe('weather chat runtime', () => {
  it('scopes the turn to weather tools when the user asks for climate information', async () => {
    const result = await chat.resolveRuntime?.({
      requestContext: {
        rawMessages: [],
        messages: [],
        locale: 'es',
        isEnglish: false,
        sessionId: null,
        username: 'tester',
        hasQuoteContext: false,
        explicitCommandId: null,
        lastUserMessageIndex: 0,
        lastUserMessage: 'Dame el clima para Carmen de Apicala',
        slashCommandId: null,
        normalizedLastUserMessage: 'Dame el clima para Carmen de Apicala',
      },
      enabledCardIds: new Set(['weather_forecast']),
      cardConfigById: {},
      abortSignal: undefined,
      forcedToolId: null,
      actorUserId: null,
      username: 'tester',
    });

    expect(result).toEqual({
      allowedToolIds: ['show_weather_forecast'],
    });
  });

  it('does not scope unrelated turns', async () => {
    const result = await chat.resolveRuntime?.({
      requestContext: {
        rawMessages: [],
        messages: [],
        locale: 'es',
        isEnglish: false,
        sessionId: null,
        username: 'tester',
        hasQuoteContext: false,
        explicitCommandId: null,
        lastUserMessageIndex: 0,
        lastUserMessage: 'Muéstrame el precio del oro',
        slashCommandId: null,
        normalizedLastUserMessage: 'Muéstrame el precio del oro',
      },
      enabledCardIds: new Set(['weather_forecast']),
      cardConfigById: {},
      abortSignal: undefined,
      forcedToolId: null,
      actorUserId: null,
      username: 'tester',
    });

    expect(result).toBeNull();
  });
});
