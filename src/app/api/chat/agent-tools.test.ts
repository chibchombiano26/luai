import { describe, expect, it } from 'vitest';
import { getAgentTools } from './agent-tools';

describe('getAgentTools', () => {
  it('filters available tools when runtime scopes the current turn', () => {
    const tools = getAgentTools(
      {
        isEnglish: false,
        detectedPlate: null,
        enabledCardIds: new Set(['market_asset_lookup', 'weather_forecast']),
        cardConfigById: {
          market_asset_lookup: {},
          weather_forecast: {},
        },
      },
      {
        allowedToolIds: new Set(['show_market_asset']),
      }
    );

    expect(Object.keys(tools)).toEqual(['show_market_asset']);
  });
});
