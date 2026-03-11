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
  saveMarketPackSettings: vi.fn(),
}));

vi.mock('@packs/markets/shared/access', () => ({
  ensureMarketAdminAccess: vi.fn(),
  responseJson: (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    }),
}));

import { GET, POST } from './admin-settings';
import { getFallbackMarketAssets, listMarketAssets } from '@packs/markets/shared/gold-api';
import { getMarketPackSettings, saveMarketPackSettings } from '@packs/markets/shared/settings';
import { ensureMarketAdminAccess } from '@packs/markets/shared/access';

describe('market admin settings route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns auth response when admin access is denied', async () => {
    vi.mocked(ensureMarketAdminAccess).mockResolvedValue(
      new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })
    );

    const response = await GET(new Request('http://localhost'));

    expect(response.status).toBe(403);
  });

  it('loads settings and falls back to local assets', async () => {
    vi.mocked(ensureMarketAdminAccess).mockResolvedValue(null);
    vi.mocked(getMarketPackSettings).mockResolvedValue({
      defaultSymbol: 'XAU',
      featuredSymbols: ['XAU'],
      refreshIntervalSeconds: 30,
      showCryptoAssets: true,
    });
    vi.mocked(listMarketAssets).mockRejectedValue(new Error('down'));
    vi.mocked(getFallbackMarketAssets).mockReturnValue([{ symbol: 'XAG', name: 'Silver' }]);

    const response = await GET(new Request('http://localhost'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      settings: expect.any(Object),
      assets: [{ symbol: 'XAG', name: 'Silver' }],
    });
  });

  it('validates and saves settings', async () => {
    vi.mocked(ensureMarketAdminAccess).mockResolvedValue(null);
    vi.mocked(saveMarketPackSettings).mockResolvedValue({
      defaultSymbol: 'XAU',
      featuredSymbols: ['XAU', 'XAG'],
      refreshIntervalSeconds: 60,
      showCryptoAssets: true,
    });

    const invalid = await POST(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          defaultSymbol: '',
          featuredSymbols: [],
          refreshIntervalSeconds: 5,
          showCryptoAssets: 'yes',
        }),
      })
    );
    expect(invalid.status).toBe(400);

    const response = await POST(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          defaultSymbol: 'XAU',
          featuredSymbols: ['XAU', 'XAG'],
          refreshIntervalSeconds: 60,
          showCryptoAssets: true,
        }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      settings: expect.objectContaining({
        refreshIntervalSeconds: 60,
      }),
    });
  });

  it('returns 500 on unexpected failures', async () => {
    vi.mocked(ensureMarketAdminAccess).mockResolvedValue(null);
    vi.mocked(saveMarketPackSettings).mockRejectedValue(new Error('boom'));

    const response = await POST(
      new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({
          defaultSymbol: 'XAU',
          featuredSymbols: ['XAU'],
          refreshIntervalSeconds: 60,
          showCryptoAssets: true,
        }),
      })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Failed to save market settings',
    });
  });
});
