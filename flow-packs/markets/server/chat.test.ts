import { describe, expect, it } from 'vitest';
import { chat } from './index';

describe('markets chat runtime', () => {
  it('scopes the turn to the market tool when the latest message asks for a supported asset', async () => {
    const result = await chat.resolveRuntime?.({
      requestContext: {
        rawMessages: [],
        messages: [],
        locale: 'es',
        isEnglish: false,
        sessionId: null,
        username: 'tester',
        hasQuoteContext: true,
        explicitCommandId: null,
        lastUserMessageIndex: 0,
        lastUserMessage: 'Cual es el precio de la plata',
        slashCommandId: null,
        normalizedLastUserMessage: 'Cual es el precio de la plata',
      },
      enabledCardIds: new Set(['market_asset_lookup']),
      cardConfigById: {},
      abortSignal: undefined,
      forcedToolId: null,
      actorUserId: null,
      username: 'tester',
    });

    expect(result).toEqual({
      allowedToolIds: ['show_market_asset'],
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
        hasQuoteContext: true,
        explicitCommandId: null,
        lastUserMessageIndex: 0,
        lastUserMessage: 'Necesito una cotizacion para mi carro',
        slashCommandId: null,
        normalizedLastUserMessage: 'Necesito una cotizacion para mi carro',
      },
      enabledCardIds: new Set(['market_asset_lookup']),
      cardConfigById: {},
      abortSignal: undefined,
      forcedToolId: null,
      actorUserId: null,
      username: 'tester',
    });

    expect(result).toBeNull();
  });
});
