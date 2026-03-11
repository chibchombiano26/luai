import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  findMarketAssetSymbolInText,
  getMarketAssetQuote,
  listMarketAssets,
  resolveMarketAssetSymbol,
} from './gold-api';

describe('gold-api shared client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads and sorts symbols', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { name: 'Silver', symbol: 'XAG' },
          { name: 'Gold', symbol: 'XAU' },
        ],
      })
    );

    await expect(listMarketAssets()).resolves.toEqual([
      { name: 'Gold', symbol: 'XAU' },
      { name: 'Silver', symbol: 'XAG' },
    ]);
  });

  it('parses a quote and injects the unit label', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          name: 'Gold',
          price: 5204,
          symbol: 'XAU',
          updatedAt: '2026-03-10T18:51:35Z',
          updatedAtReadable: 'a few seconds ago',
        }),
      })
    );

    await expect(getMarketAssetQuote('xau', { locale: 'es' })).resolves.toMatchObject({
      symbol: 'XAU',
      name: 'Gold',
      price: 5204,
      unitLabel: 'USD por onza',
    });
  });

  it('resolves common aliases to supported symbols', () => {
    expect(resolveMarketAssetSymbol('oro')).toBe('XAU');
    expect(resolveMarketAssetSymbol('silver')).toBe('XAG');
    expect(resolveMarketAssetSymbol('btc')).toBe('BTC');
  });

  it('detects supported assets inside natural-language sentences', () => {
    expect(findMarketAssetSymbolInText('cual es el precio de la plata')).toBe('XAG');
    expect(findMarketAssetSymbolInText('show me bitcoin right now')).toBe('BTC');
  });
});
