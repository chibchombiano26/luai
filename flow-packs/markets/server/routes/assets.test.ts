import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@packs/markets/shared/gold-api', async () => {
  const actual = await vi.importActual<typeof import('@packs/markets/shared/gold-api')>(
    '@packs/markets/shared/gold-api'
  );

  return {
    ...actual,
    getFallbackMarketAssets: vi.fn(),
    isCryptoMarketAsset: vi.fn(),
    listMarketAssets: vi.fn(),
  };
});

vi.mock('@packs/markets/shared/settings', () => ({
  getMarketPackSettings: vi.fn(),
}));

import { GET } from './assets';
import {
  getFallbackMarketAssets,
  isCryptoMarketAsset,
  listMarketAssets,
} from '@packs/markets/shared/gold-api';
import { getMarketPackSettings } from '@packs/markets/shared/settings';

describe('markets assets route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filters crypto assets when the setting disables them', async () => {
    vi.mocked(getMarketPackSettings).mockResolvedValue({
      defaultSymbol: 'XAU',
      featuredSymbols: ['XAU', 'BTC'],
      refreshIntervalSeconds: 30,
      showCryptoAssets: false,
    });
    vi.mocked(listMarketAssets).mockResolvedValue([
      { symbol: 'XAU', name: 'Gold' },
      { symbol: 'BTC', name: 'Bitcoin' },
    ]);
    vi.mocked(isCryptoMarketAsset).mockImplementation((symbol) => symbol === 'BTC');

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      assets: [{ symbol: 'XAU', name: 'Gold' }],
      settings: expect.objectContaining({
        showCryptoAssets: false,
      }),
    });
  });

  it('falls back to local assets when the provider list fails', async () => {
    vi.mocked(getMarketPackSettings).mockResolvedValue({
      defaultSymbol: 'XAU',
      featuredSymbols: ['XAU'],
      refreshIntervalSeconds: 30,
      showCryptoAssets: true,
    });
    vi.mocked(listMarketAssets).mockRejectedValue(new Error('down'));
    vi.mocked(getFallbackMarketAssets).mockReturnValue([{ symbol: 'XAG', name: 'Silver' }]);

    const response = await GET();

    await expect(response.json()).resolves.toEqual({
      assets: [{ symbol: 'XAG', name: 'Silver' }],
      settings: expect.any(Object),
    });
  });

  it('returns a 500 response on unexpected failures', async () => {
    vi.mocked(getMarketPackSettings).mockRejectedValue(new Error('boom'));

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Failed to load market assets',
    });
  });
});
