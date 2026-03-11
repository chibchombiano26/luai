import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getRepositories } from '@/lib/repositories/repository-factory';
import {
  getMarketPackSettings,
  getStoredMarketProfilePreferences,
  sanitizeMarketPackSettings,
  saveStoredMarketProfilePreferences,
} from './settings';

vi.mock('@/lib/repositories/repository-factory', () => ({
  getRepositories: vi.fn(),
}));

function buildPlatformSettingsMock() {
  return {
    findById: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined),
  };
}

describe('market settings extra coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('falls back to defaults when persisted json is invalid', async () => {
    const platformSettings = buildPlatformSettingsMock();
    platformSettings.findById.mockResolvedValue({ config: '{bad-json' });
    vi.mocked(getRepositories).mockResolvedValue({ platformSettings } as never);

    await expect(getMarketPackSettings()).resolves.toEqual({
      defaultSymbol: 'XAU',
      featuredSymbols: ['XAU', 'XAG', 'XPT', 'BTC'],
      refreshIntervalSeconds: 30,
      showCryptoAssets: true,
    });
  });

  it('drops crypto defaults when the pack hides crypto assets', () => {
    expect(
      sanitizeMarketPackSettings({
        defaultSymbol: 'btc',
        featuredSymbols: [],
        refreshIntervalSeconds: 600,
        showCryptoAssets: false,
      })
    ).toEqual({
      defaultSymbol: 'XAU',
      featuredSymbols: ['XAU', 'XAU', 'XAG', 'XPT'],
      refreshIntervalSeconds: 300,
      showCryptoAssets: false,
    });
  });

  it('falls back to sanitized preferences when stored json is invalid and saves anonymous users', async () => {
    const platformSettings = buildPlatformSettingsMock();
    platformSettings.findById.mockResolvedValue({ config: '{bad-json' });
    vi.mocked(getRepositories).mockResolvedValue({ platformSettings } as never);

    await expect(
      getStoredMarketProfilePreferences(null, {
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

    await saveStoredMarketProfilePreferences(
      null,
      {
        defaultSymbol: 'BTC',
        favoriteSymbols: ['BTC'],
        compactView: true,
      },
      {
        defaultSymbol: 'XAU',
        featuredSymbols: ['XAU', 'XAG', 'BTC'],
        refreshIntervalSeconds: 30,
        showCryptoAssets: true,
      }
    );

    expect(platformSettings.save).toHaveBeenCalledWith(
      'market_profile_preferences:anonymous',
      JSON.stringify({
        defaultSymbol: 'BTC',
        favoriteSymbols: ['BTC'],
        compactView: true,
      })
    );
  });
});
