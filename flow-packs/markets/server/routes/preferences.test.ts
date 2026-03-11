import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@packs/markets/shared/gold-api', async () => {
  const actual = await vi.importActual<typeof import('@packs/markets/shared/gold-api')>(
    '@packs/markets/shared/gold-api'
  );

  return {
    ...actual,
    getFallbackMarketAssets: vi.fn(),
    listMarketAssets: vi.fn(),
  };
});

vi.mock('@packs/markets/shared/settings', () => ({
  getMarketPackSettings: vi.fn(),
  getStoredMarketProfilePreferences: vi.fn(),
  saveStoredMarketProfilePreferences: vi.fn(),
}));

vi.mock('@packs/markets/shared/access', () => ({
  resolveMarketUserContext: vi.fn(),
  responseJson: (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    }),
}));

import { GET, POST } from './preferences';
import { getFallbackMarketAssets, listMarketAssets } from '@packs/markets/shared/gold-api';
import {
  getMarketPackSettings,
  getStoredMarketProfilePreferences,
  saveStoredMarketProfilePreferences,
} from '@packs/markets/shared/settings';
import { resolveMarketUserContext } from '@packs/markets/shared/access';

describe('markets preferences route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns auth response when the user is not allowed', async () => {
    vi.mocked(resolveMarketUserContext).mockResolvedValue(
      new Response(JSON.stringify({ error: 'auth' }), { status: 401 })
    );

    const response = await GET(new Request('http://localhost'));

    expect(response.status).toBe(401);
  });

  it('loads preferences with fallback assets', async () => {
    vi.mocked(resolveMarketUserContext).mockResolvedValue({
      username: 'luisa',
      displayName: 'Luisa',
    });
    vi.mocked(getMarketPackSettings).mockResolvedValue({
      defaultSymbol: 'XAU',
      featuredSymbols: ['XAU'],
      refreshIntervalSeconds: 30,
      showCryptoAssets: true,
    });
    vi.mocked(listMarketAssets).mockRejectedValue(new Error('down'));
    vi.mocked(getFallbackMarketAssets).mockReturnValue([{ symbol: 'XAG', name: 'Silver' }]);
    vi.mocked(getStoredMarketProfilePreferences).mockResolvedValue({
      defaultSymbol: 'XAU',
      favoriteSymbols: ['XAU'],
      compactView: false,
    });

    const response = await GET(new Request('http://localhost'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      preferences: expect.objectContaining({ defaultSymbol: 'XAU' }),
      settings: expect.any(Object),
      assets: [{ symbol: 'XAG', name: 'Silver' }],
    });
  });

  it('validates and saves posted preferences', async () => {
    vi.mocked(resolveMarketUserContext).mockResolvedValue({
      username: 'luisa',
      displayName: 'Luisa',
    });
    vi.mocked(getMarketPackSettings).mockResolvedValue({
      defaultSymbol: 'XAU',
      featuredSymbols: ['XAU', 'BTC'],
      refreshIntervalSeconds: 30,
      showCryptoAssets: true,
    });
    vi.mocked(saveStoredMarketProfilePreferences).mockResolvedValue({
      defaultSymbol: 'BTC',
      favoriteSymbols: ['BTC'],
      compactView: true,
    });

    const invalid = await POST(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ defaultSymbol: '', favoriteSymbols: [], compactView: 'yes' }),
      })
    );
    expect(invalid.status).toBe(400);

    const response = await POST(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          defaultSymbol: 'BTC',
          favoriteSymbols: ['BTC'],
          compactView: true,
        }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      preferences: {
        defaultSymbol: 'BTC',
        favoriteSymbols: ['BTC'],
        compactView: true,
      },
    });
  });

  it('returns 500 when saving fails unexpectedly', async () => {
    vi.mocked(resolveMarketUserContext).mockResolvedValue({
      username: 'luisa',
      displayName: 'Luisa',
    });
    vi.mocked(getMarketPackSettings).mockRejectedValue(new Error('boom'));

    const response = await POST(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          defaultSymbol: 'BTC',
          favoriteSymbols: ['BTC'],
          compactView: true,
        }),
      })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Failed to save market preferences',
    });
  });
});
