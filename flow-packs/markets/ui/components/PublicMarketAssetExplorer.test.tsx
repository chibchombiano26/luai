import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

import { PublicMarketAssetExplorer } from './PublicMarketAssetExplorer';

describe('PublicMarketAssetExplorer', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    replaceMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads assets and details, navigates on selection, and refreshes', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          assets: [
            { symbol: 'XAU', name: 'Gold' },
            { symbol: 'BTC', name: 'Bitcoin' },
          ],
          settings: {
            defaultSymbol: 'XAU',
            featuredSymbols: ['XAU', 'BTC'],
            refreshIntervalSeconds: 30,
            showCryptoAssets: true,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          asset: {
            symbol: 'XAU',
            name: 'Gold',
            price: 5178.2,
            updatedAt: '2026-03-11T16:00:00Z',
            updatedAtReadable: 'a few seconds ago',
            unitLabel: 'usd por onza',
          },
          compare: [
            {
              symbol: 'BTC',
              name: 'Bitcoin',
              price: 70518.94,
              updatedAt: '2026-03-11T16:00:00Z',
              updatedAtReadable: 'a few seconds ago',
              unitLabel: 'usd por unidad',
            },
          ],
          settings: {
            defaultSymbol: 'XAU',
            featuredSymbols: ['XAU', 'BTC'],
            refreshIntervalSeconds: 30,
            showCryptoAssets: true,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          asset: {
            symbol: 'BTC',
            name: 'Bitcoin',
            price: 70518.94,
            updatedAt: '2026-03-11T16:00:30Z',
            updatedAtReadable: 'moments ago',
            unitLabel: 'usd por unidad',
          },
          compare: [],
          settings: {
            defaultSymbol: 'XAU',
            featuredSymbols: ['XAU', 'BTC'],
            refreshIntervalSeconds: 30,
            showCryptoAssets: true,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          asset: {
            symbol: 'BTC',
            name: 'Bitcoin',
            price: 70518.94,
            updatedAt: '2026-03-11T16:01:00Z',
            updatedAtReadable: 'just now',
            unitLabel: 'usd por unidad',
          },
          compare: [],
          settings: {
            defaultSymbol: 'XAU',
            featuredSymbols: ['XAU', 'BTC'],
            refreshIntervalSeconds: 30,
            showCryptoAssets: true,
          },
        }),
      });

    render(<PublicMarketAssetExplorer locale="es" />);

    await screen.findByText('Explorador de activos');
    await screen.findByText('Comparaciones rapidas');
    expect(screen.getByText('Actualizacion automatica cada 30 segundos')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Activo'), {
      target: { value: 'BTC' },
    });

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/flow/markets/BTC');
    });
    await screen.findByText('No hay comparaciones configuradas.');

    fireEvent.click(screen.getByRole('button', { name: /actualizar/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/flow/markets/assets/BTC',
        expect.any(Object)
      );
    });
  });

  it('shows request errors', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });

    render(<PublicMarketAssetExplorer locale="en" initialSymbol="xag" />);

    await screen.findByText('Could not load the asset.');
    expect(screen.getByRole('combobox')).toHaveValue('XAG');
  });
});
