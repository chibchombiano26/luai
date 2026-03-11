import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chat, show_market_asset } from './index';
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

describe('show_market_asset extra coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds english payloads and accepts compare symbols from strings', async () => {
    vi.mocked(getMarketAssetQuote).mockResolvedValueOnce({
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 70518.94,
      updatedAt: '2026-03-11T16:00:00Z',
      updatedAtReadable: 'a few seconds ago',
      unitLabel: 'USD per unit',
    });

    const tool = show_market_asset({
      isEnglish: true,
      detectedPlate: null,
      cardConfigById: {
        market_asset_lookup: {
          compareSymbols: 'XAU, XAG, BTC',
        },
      },
    });

    const result = await tool.execute({ asset: 'bitcoin' });

    expect(result).toMatchObject({
      type: 'dynamic_card',
      title: 'Market asset',
      message: 'Bitcoin (BTC) is trading at $70,518.94 usd per unit.',
      details: expect.arrayContaining([
        expect.objectContaining({
          label: 'Compare with',
          value: 'XAU, XAG',
        }),
      ]),
    });
  });

  it('rethrows abort provider errors', async () => {
    const abortError = new Error('The operation was aborted.');
    abortError.name = 'AbortError';
    vi.mocked(getMarketAssetQuote).mockRejectedValueOnce(abortError);

    const tool = show_market_asset({
      isEnglish: true,
      detectedPlate: null,
      cardConfigById: {
        market_asset_lookup: {},
      },
    });

    await expect(tool.execute({ query: 'bitcoin' })).rejects.toThrow('The operation was aborted.');
  });

  it('scopes chat turns only when a market asset is detected', async () => {
    await expect(
      chat.resolveRuntime({
        requestContext: {
          normalizedLastUserMessage: 'precio del oro hoy',
        },
      } as never)
    ).resolves.toEqual({
      allowedToolIds: ['show_market_asset'],
    });

    await expect(
      chat.resolveRuntime({
        requestContext: {
          normalizedLastUserMessage: 'hola equipo',
        },
      } as never)
    ).resolves.toBeNull();
  });
});
