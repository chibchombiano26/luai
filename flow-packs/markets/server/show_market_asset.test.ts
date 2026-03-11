import { beforeEach, describe, expect, it, vi } from 'vitest';
import { show_market_asset } from './index';
import { getMarketAssetQuote } from '@packs/markets/shared/gold-api';

vi.mock('@packs/markets/shared/gold-api', async () => {
  const actual = await vi.importActual<typeof import('@packs/markets/shared/gold-api')>(
    '@packs/markets/shared/gold-api'
  );

  return {
    ...actual,
    getMarketAssetQuote: vi.fn(),
  };
});

describe('show_market_asset tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves aliases and returns a dynamic card', async () => {
    vi.mocked(getMarketAssetQuote).mockResolvedValueOnce({
      symbol: 'XAU',
      name: 'Gold',
      price: 5204,
      updatedAt: '2026-03-10T18:51:35Z',
      updatedAtReadable: 'a few seconds ago',
      unitLabel: 'USD por onza',
    });

    const tool = show_market_asset({
      isEnglish: false,
      detectedPlate: null,
      cardConfigById: {
        market_asset_lookup: {
          compareSymbols: ['XAG', 'BTC'],
        },
      },
    });

    const result = await tool.execute({ query: 'oro' });

    expect(getMarketAssetQuote).toHaveBeenCalledWith('XAU', {
      signal: undefined,
      locale: 'es',
    });
    expect(result).toMatchObject({
      type: 'dynamic_card',
      cardId: 'market_asset_lookup',
      title: 'Activo de mercado',
    });
  });

  it('returns an error for unknown assets', async () => {
    const tool = show_market_asset({
      isEnglish: true,
      detectedPlate: null,
      cardConfigById: {
        market_asset_lookup: {},
      },
    });

    const result = await tool.execute({ query: 'unknown-asset' });
    expect(result).toEqual({
      type: 'error',
      message: 'Please provide a valid asset such as gold, silver, copper, bitcoin, or ethereum.',
    });
  });

  it('returns a localized provider error', async () => {
    vi.mocked(getMarketAssetQuote).mockRejectedValueOnce(new Error('Remote down'));

    const tool = show_market_asset({
      isEnglish: false,
      detectedPlate: null,
      cardConfigById: {
        market_asset_lookup: {
          defaultSymbol: 'XAU',
        },
      },
    });

    await expect(tool.execute({ query: 'oro' })).resolves.toEqual({
      type: 'error',
      message: 'Error al consultar el activo de mercado: Remote down',
    });
  });

  it('does not fall back to gold when the model omits the asset', async () => {
    const tool = show_market_asset({
      isEnglish: false,
      detectedPlate: null,
      cardConfigById: {
        market_asset_lookup: {
          defaultSymbol: 'XAU',
        },
      },
    });

    await expect(tool.execute({})).resolves.toEqual({
      type: 'error',
      message: 'Indica un activo valido como oro, plata, cobre, bitcoin o ethereum.',
    });
    expect(getMarketAssetQuote).not.toHaveBeenCalled();
  });
});
