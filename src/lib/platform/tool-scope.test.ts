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

  it('scopes a pokemon turn from public card metadata keywords', () => {
    expect(
      inferScopedToolIdsFromCardMetadata({
        enabledCardIds: new Set(['pokemon_lookup', 'weather_forecast', 'market_asset_lookup']),
        locale: 'es',
        message: 'Puedes buscar el Pokemon Bulbasaur',
      })
    ).toEqual(new Set(['show_pokemon_lookup']));
  });

  it('does not scope unrelated generic turns', () => {
    expect(
      inferScopedToolIdsFromCardMetadata({
        enabledCardIds: new Set(['pokemon_lookup', 'weather_forecast', 'market_asset_lookup']),
        locale: 'es',
        message: 'Hola, como estas?',
      })
    ).toBeNull();
  });
});
