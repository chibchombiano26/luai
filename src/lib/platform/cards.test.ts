import { describe, expect, it } from 'vitest';
import {
  FLOW_CARD_IDS,
  getFlowCardDefinition,
  isFlowCardId,
  resolveFlowCardStatus,
  sanitizeFlowCardSettings,
  toEnabledFlowCardIdSet,
  toFlowCardConfigById,
} from './cards';

describe('platform cards', () => {
  it('recognizes valid flow card ids', () => {
    expect(FLOW_CARD_IDS).toContain('weather_forecast');
    expect(isFlowCardId('weather_forecast')).toBe(true);
    expect(isFlowCardId('missing_card')).toBe(false);
    expect(isFlowCardId(null)).toBe(false);
  });

  it('returns card definitions and throws for unknown cards', () => {
    expect(getFlowCardDefinition('weather_forecast')).toEqual(
      expect.objectContaining({
        id: 'weather_forecast',
        kind: 'native',
      })
    );

    expect(() =>
      getFlowCardDefinition('missing_card' as never)
    ).toThrow('Unknown flow card id');
  });

  it('resolves card status with defaults and overrides', () => {
    const resolved = resolveFlowCardStatus({
      enabledByCardId: {
        weather_forecast: true,
      },
      configByCardId: {
        weather_forecast: {
          units: 'metric',
        },
      },
    });

    expect(resolved).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'weather_forecast',
          enabled: true,
          config: { units: 'metric' },
        }),
      ])
    );
  });

  it('sanitizes incoming settings and strips invalid entries', () => {
    const sanitized = sanitizeFlowCardSettings({
      enabledByCardId: {
        weather_forecast: 'yes',
        unknown: false,
      },
      configByCardId: {
        weather_forecast: { provider: 'open-meteo' },
        unknown: { ignored: true },
      },
    });

    expect(sanitized).toEqual({
      enabledByCardId: {},
      configByCardId: {
        weather_forecast: { provider: 'open-meteo' },
      },
    });
  });

  it('returns empty settings for non-object input and falls back to defaults for invalid config shapes', () => {
    expect(sanitizeFlowCardSettings(null)).toEqual({
      enabledByCardId: {},
      configByCardId: {},
    });

    const resolved = resolveFlowCardStatus({
      enabledByCardId: {
        weather_forecast: true,
      },
      configByCardId: {
        weather_forecast: [] as never,
      },
    });

    expect(
      resolved.find((card) => card.id === 'weather_forecast')
    ).toEqual(
      expect.objectContaining({
        enabled: true,
        config: [],
      })
    );
  });

  it('builds enabled card sets and config maps from settings', () => {
    const settings = {
      enabledByCardId: {
        weather_forecast: true,
      },
      configByCardId: {
        weather_forecast: { units: 'metric' },
      },
    };

    const enabledCardIds = toEnabledFlowCardIdSet(settings);
    expect(enabledCardIds).toEqual(expect.any(Set));
    expect(enabledCardIds.has('weather_forecast')).toBe(true);
    expect(toFlowCardConfigById(settings)).toEqual(
      expect.objectContaining({
        weather_forecast: { units: 'metric' },
      })
    );
  });
});
