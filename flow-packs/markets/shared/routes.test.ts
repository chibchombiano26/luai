import { describe, expect, it } from 'vitest';
import { buildMarketAssetPagePath } from './routes';

describe('market routes helpers', () => {
  it('builds normalized asset paths and falls back to gold', () => {
    expect(buildMarketAssetPagePath('btc')).toBe('/flow/markets/BTC');
    expect(buildMarketAssetPagePath(' xag ')).toBe('/flow/markets/XAG');
    expect(buildMarketAssetPagePath('@@@')).toBe('/flow/markets/XAU');
  });
});
