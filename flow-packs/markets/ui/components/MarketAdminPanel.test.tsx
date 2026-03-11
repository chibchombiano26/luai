import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MarketAdminPanel } from './MarketAdminPanel';

describe('MarketAdminPanel', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads settings, updates fields, toggles featured assets, and saves', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          settings: {
            defaultSymbol: 'XAU',
            featuredSymbols: ['XAU', 'XAG'],
            refreshIntervalSeconds: 30,
            showCryptoAssets: true,
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
          settings: {
            defaultSymbol: 'BTC',
            featuredSymbols: ['XAG', 'BTC'],
            refreshIntervalSeconds: 45,
            showCryptoAssets: false,
          },
        }),
      });

    render(<MarketAdminPanel locale="es" />);

    expect(screen.getByText('Cargando configuracion...')).toBeInTheDocument();
    await screen.findByText('Configuracion del modulo de mercados');

    fireEvent.change(screen.getByLabelText('Activo por defecto'), {
      target: { value: 'BTC' },
    });
    fireEvent.change(screen.getByLabelText('Refresco automatico (segundos)'), {
      target: { value: '45' },
    });
    fireEvent.click(screen.getByLabelText('Mostrar criptoactivos en explorador y perfil'));
    fireEvent.click(screen.getByRole('button', { name: /btc/i }));
    fireEvent.click(screen.getByRole('button', { name: /guardar configuracion/i }));

    await screen.findByText('Configuracion guardada.');
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/flow/markets/admin/settings',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          defaultSymbol: 'BTC',
          featuredSymbols: ['XAU', 'XAG', 'BTC'],
          refreshIntervalSeconds: 45,
          showCryptoAssets: false,
        }),
      })
    );
  });

  it('keeps the loading shell when the initial request fails', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

    render(<MarketAdminPanel locale="en" />);
    await screen.findByText('Loading settings...');
  });

  it('shows save errors after a successful load', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          settings: {
            defaultSymbol: 'XAU',
            featuredSymbols: ['XAU'],
            refreshIntervalSeconds: 30,
            showCryptoAssets: true,
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

    render(<MarketAdminPanel locale="en" />);
    await screen.findByText('Market module settings');
    fireEvent.click(screen.getByRole('button', { name: /save settings/i }));

    await waitFor(() => {
      expect(screen.getByText('save-failed')).toBeInTheDocument();
    });
  });
});
