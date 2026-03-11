import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MarketProfileWidget } from './MarketProfileWidget';

describe('MarketProfileWidget', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads preferences, updates them, and saves quick links', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          preferences: {
            defaultSymbol: 'XAU',
            favoriteSymbols: ['XAU', 'XAG'],
            compactView: false,
          },
          settings: {
            defaultSymbol: 'XAU',
            featuredSymbols: ['XAU', 'XAG'],
          },
          assets: [
            { symbol: 'XAU', name: 'Gold' },
            { symbol: 'XAG', name: 'Silver' },
            { symbol: 'BTC', name: 'Bitcoin' },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          preferences: {
            defaultSymbol: 'BTC',
            favoriteSymbols: ['XAG', 'BTC'],
            compactView: true,
          },
        }),
      });

    render(<MarketProfileWidget locale="es" profile={{} as never} usage={{} as never} />);

    await screen.findByText('Opciones de mercados');
    fireEvent.change(screen.getByLabelText('Activo inicial'), {
      target: { value: 'BTC' },
    });
    fireEvent.click(screen.getByLabelText('Vista compacta en el widget'));
    fireEvent.click(screen.getByRole('button', { name: /btc/i }));
    fireEvent.click(screen.getByRole('button', { name: /guardar opciones/i }));

    await screen.findByText('Opciones guardadas.');
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/flow/markets/preferences',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          defaultSymbol: 'BTC',
          favoriteSymbols: ['XAU', 'XAG', 'BTC'],
          compactView: true,
        }),
      })
    );
    expect(screen.getByRole('link', { name: 'XAG' })).toHaveAttribute('href', '/flow/markets/XAG');
  });

  it('keeps the loading shell when the initial request fails', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

    render(<MarketProfileWidget locale="en" profile={{} as never} usage={{} as never} />);
    await screen.findByText('Loading market options...');
  });

  it('shows save errors after a successful load', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          preferences: {
            defaultSymbol: 'XAU',
            favoriteSymbols: ['XAU'],
            compactView: false,
          },
          settings: {
            defaultSymbol: 'XAU',
            featuredSymbols: ['XAU'],
          },
          assets: [{ symbol: 'XAU', name: 'Gold' }],
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'save-failed',
        }),
      });

    render(<MarketProfileWidget locale="en" profile={{} as never} usage={{} as never} />);
    await screen.findByText('Market options');
    fireEvent.click(screen.getByRole('button', { name: /save options/i }));

    await waitFor(() => {
      expect(screen.getByText('save-failed')).toBeInTheDocument();
    });
  });
});
