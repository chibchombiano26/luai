import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getRepositories } from '@/lib/repositories/repository-factory';
import {
  getMarketPackSettings,
  getStoredMarketProfilePreferences,
  sanitizeMarketPackSettings,
  sanitizeMarketProfilePreferences,
  saveMarketPackSettings,
  saveStoredMarketProfilePreferences,
} from './settings';

vi.mock('@/lib/repositories/repository-factory', () => ({
  getRepositories: vi.fn(),
}));

function buildPlatformSettingsMock() {
  return {
    findById: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined),
  };
}

describe('market settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns defaults and persists them when the row is missing', async () => {
    const platformSettings = buildPlatformSettingsMock();
    vi.mocked(getRepositories).mockResolvedValue({ platformSettings } as never);

    await expect(getMarketPackSettings()).resolves.toEqual({
      defaultSymbol: 'XAU',
      featuredSymbols: ['XAU', 'XAG', 'XPT', 'BTC'],
      refreshIntervalSeconds: 30,
      showCryptoAssets: true,
    });
    expect(platformSettings.save).toHaveBeenCalledWith(
      'market_asset_pack_settings',
      JSON.stringify({
        defaultSymbol: 'XAU',
        featuredSymbols: ['XAU', 'XAG', 'XPT', 'BTC'],
        refreshIntervalSeconds: 30,
        showCryptoAssets: true,
      })
    );
  });

  it('sanitizes invalid persisted values', () => {
    expect(
      sanitizeMarketPackSettings({
        defaultSymbol: 'btc',
        featuredSymbols: ['xag', 'btc', 'xag'],
        refreshIntervalSeconds: 5,
        showCryptoAssets: false,
      })
    ).toEqual({
      defaultSymbol: 'XAU',
      featuredSymbols: ['XAG'],
      refreshIntervalSeconds: 10,
      showCryptoAssets: false,
    });
  });

  it('loads and saves user preferences with global defaults', async () => {
    const platformSettings = buildPlatformSettingsMock();
    vi.mocked(getRepositories).mockResolvedValue({ platformSettings } as never);

    await expect(
      getStoredMarketProfilePreferences('alice', {
        defaultSymbol: 'XAU',
        featuredSymbols: ['XAU', 'XAG', 'XPT'],
        refreshIntervalSeconds: 30,
        showCryptoAssets: true,
      })
    ).resolves.toEqual({
      defaultSymbol: 'XAU',
      favoriteSymbols: ['XAU', 'XAG', 'XPT'],
      compactView: false,
    });

    await expect(
      saveStoredMarketProfilePreferences(
        'alice',
        {
          defaultSymbol: 'BTC',
          favoriteSymbols: ['BTC', 'ETH'],
          compactView: true,
        },
        {
          defaultSymbol: 'XAU',
          featuredSymbols: ['XAU', 'XAG', 'BTC'],
          refreshIntervalSeconds: 30,
          showCryptoAssets: true,
        }
      )
    ).resolves.toEqual({
      defaultSymbol: 'BTC',
      favoriteSymbols: ['BTC', 'ETH'],
      compactView: true,
    });
  });

  it('sanitizes invalid profile preference shapes', () => {
    expect(
      sanitizeMarketProfilePreferences(
        {
          defaultSymbol: 'ETH',
          favoriteSymbols: ['ETH', 'BTC'],
          compactView: 'yes',
        },
        {
          defaultSymbol: 'XAU',
          featuredSymbols: ['XAU', 'XAG'],
          refreshIntervalSeconds: 30,
          showCryptoAssets: false,
        }
      )
    ).toEqual({
      defaultSymbol: 'XAU',
      favoriteSymbols: ['XAU', 'XAG'],
      compactView: false,
    });
  });

  it('saves sanitized market settings', async () => {
    const platformSettings = buildPlatformSettingsMock();
    vi.mocked(getRepositories).mockResolvedValue({ platformSettings } as never);

    await expect(
      saveMarketPackSettings({
        defaultSymbol: 'xag',
        featuredSymbols: ['xag', 'xau'],
        refreshIntervalSeconds: 45,
        showCryptoAssets: true,
      })
    ).resolves.toEqual({
      defaultSymbol: 'XAG',
      featuredSymbols: ['XAG', 'XAU'],
      refreshIntervalSeconds: 45,
      showCryptoAssets: true,
    });
  });
});
