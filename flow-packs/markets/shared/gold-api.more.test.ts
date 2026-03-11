import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  findMarketAssetSymbolInText,
  getMarketAssetQuote,
  isCryptoMarketAsset,
  listMarketAssets,
  resolveMarketAssetSymbol,
} from './gold-api';

describe('gold-api extra coverage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('supports crypto units and rejects empty symbols', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          name: 'Bitcoin',
          price: 70518.94,
          symbol: 'BTC',
          updatedAt: '2026-03-10T18:51:35Z',
          updatedAtReadable: 'a few seconds ago',
        }),
      })
    );

    await expect(getMarketAssetQuote('btc', { locale: 'en' })).resolves.toMatchObject({
      unitLabel: 'USD per unit',
    });
    await expect(getMarketAssetQuote('')).rejects.toThrow('Asset symbol is required.');
    expect(isCryptoMarketAsset('eth')).toBe(true);
  });

  it('returns null for empty queries and detects names or tokens inside text', () => {
    expect(resolveMarketAssetSymbol('   ')).toBeNull();
    expect(resolveMarketAssetSymbol('Gold')).toBe('XAU');
    expect(findMarketAssetSymbolInText('comparar metal con xpt')).toBe('XPT');
    expect(findMarketAssetSymbolInText('')).toBeNull();
  });

  it('turns provider aborts into a standard abort error', async () => {
    const abortController = new AbortController();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (_url, init?: RequestInit) => {
        const signal = init?.signal as AbortSignal;
        await new Promise((resolve, reject) => {
          signal.addEventListener('abort', () => {
            const error = new DOMException('Aborted', 'AbortError');
            reject(error);
          });
          abortController.abort();
          resolve(null);
        });
      })
    );

    await expect(listMarketAssets({ signal: abortController.signal })).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});
