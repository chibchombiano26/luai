import { describe, expect, it } from 'vitest';
import { inferScopedToolIdsFromCardMetadata } from './tool-scope';

describe('inferScopedToolIdsFromCardMetadata', () => {
  it('scopes a weather turn from card metadata alone', () => {
    expect(
      inferScopedToolIdsFromCardMetadata({
        enabledCardIds: new Set(['weather_forecast', 'market_asset_lookup']),
        locale: 'es',
        message: 'Dame el clima para Carmen de Apicala',
      })
    ).toEqual(new Set(['show_weather_forecast']));
  });

  it('scopes a market turn from commodity language', () => {
    expect(
      inferScopedToolIdsFromCardMetadata({
        enabledCardIds: new Set(['weather_forecast', 'market_asset_lookup']),
        locale: 'es',
        message: 'Cual es el precio de la plata',
      })
    ).toEqual(new Set(['show_market_asset']));
  });

  it('scopes an insurance turn from quote language and plate details', () => {
    expect(
      inferScopedToolIdsFromCardMetadata({
        enabledCardIds: new Set(['insurer_comparison', 'single_provider_quote', 'market_asset_lookup']),
        locale: 'es',
        message: 'Cotizame la placa RHO121',
      })
    ).toEqual(
      new Set([
        'collect_vehicle_info',
        'collect_owner_info',
        'quote_vehicle_policy',
        'show_quote_history',
        'show_insurer_comparison',
        'show_provider_quote',
      ])
    );
  });

  it('does not scope unrelated generic turns', () => {
    expect(
      inferScopedToolIdsFromCardMetadata({
        enabledCardIds: new Set(['insurer_comparison', 'weather_forecast', 'market_asset_lookup']),
        locale: 'es',
        message: 'Hola, como estas?',
      })
    ).toBeNull();
  });
});
