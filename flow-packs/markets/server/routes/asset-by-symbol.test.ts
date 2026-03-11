import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@packs/markets/shared/gold-api', async () => {
  const actual = await vi.importActual<typeof import('@packs/markets/shared/gold-api')>(
    '@packs/markets/shared/gold-api'
  );

  return {
    ...actual,
    getFallbackMarketAssets: vi.fn(),
    getMarketAssetQuote: vi.fn(),
    listMarketAssets: vi.fn(),
    resolveMarketAssetSymbol: vi.fn(),
  };
});

vi.mock('@packs/markets/shared/settings', () => ({
  getMarketPackSettings: vi.fn(),
}));

import { GET } from './asset-by-symbol';
import {
  getFallbackMarketAssets,
  getMarketAssetQuote,
  listMarketAssets,
  resolveMarketAssetSymbol,
} from '@packs/markets/shared/gold-api';
import { getMarketPackSettings } from '@packs/markets/shared/settings';

describe('market asset by symbol route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns the asset detail and compare list', async () => {
    vi.mocked(getMarketPackSettings).mockResolvedValue({
      defaultSymbol: 'XAU',
      featuredSymbols: ['XAU', 'XAG', 'BTC'],
      refreshIntervalSeconds: 30,
      showCryptoAssets: true,
    });
    vi.mocked(listMarketAssets).mockResolvedValue([
      { symbol: 'XAU', name: 'Gold' },
      { symbol: 'XAG', name: 'Silver' },
      { symbol: 'BTC', name: 'Bitcoin' },
    ]);
    vi.mocked(resolveMarketAssetSymbol)
      .mockReturnValueOnce('XAU')
      .mockReturnValueOnce('XAU');
    vi.mocked(getMarketAssetQuote)
      .mockResolvedValueOnce({
        symbol: 'XAU',
        name: 'Gold',
        price: 5178,
        updatedAt: '2026-03-11T16:00:00Z',
        updatedAtReadable: 'a few seconds ago',
        unitLabel: 'USD por onza',
      })
      .mockResolvedValueOnce({
        symbol: 'XAG',
        name: 'Silver',
        price: 85.88,
        updatedAt: '2026-03-11T16:00:00Z',
        updatedAtReadable: 'a few seconds ago',
        unitLabel: 'USD por onza',
      })
      .mockResolvedValueOnce({
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 70518.94,
        updatedAt: '2026-03-11T16:00:00Z',
        updatedAtReadable: 'a few seconds ago',
        unitLabel: 'USD por unidad',
      });

    const response = await GET(
      new Request('http://localhost/api/flow/markets/assets/xau', {
        headers: {
          'accept-language': 'es-CO',
        },
      }),
      { params: Promise.resolve({ symbol: 'xau' }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      asset: expect.objectContaining({ symbol: 'XAU' }),
      compare: [
        expect.objectContaining({ symbol: 'XAG' }),
        expect.objectContaining({ symbol: 'BTC' }),
      ],
      settings: expect.any(Object),
      availableSymbols: ['XAU', 'XAG', 'BTC'],
    });
    expect(getMarketAssetQuote).toHaveBeenNthCalledWith(1, 'XAU', { locale: 'es' });
  });

  it('returns 404 when no symbol can be resolved', async () => {
    vi.mocked(getMarketPackSettings).mockResolvedValue({
      defaultSymbol: 'XAU',
      featuredSymbols: ['XAU'],
      refreshIntervalSeconds: 30,
      showCryptoAssets: true,
    });
    vi.mocked(listMarketAssets).mockResolvedValue([{ symbol: 'XAU', name: 'Gold' }]);
    vi.mocked(resolveMarketAssetSymbol).mockReturnValue(null);

    const response = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ symbol: 'unknown' }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: 'Unknown market asset',
    });
  });

  it('returns 500 when the lookup fails', async () => {
    vi.mocked(getMarketPackSettings).mockRejectedValue(new Error('boom'));
    vi.mocked(getFallbackMarketAssets).mockReturnValue([{ symbol: 'XAU', name: 'Gold' }]);

    const response = await GET(new Request('http://localhost'), {
      params: Promise.resolve({ symbol: 'xau' }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Failed to load market asset',
    });
  });
});
