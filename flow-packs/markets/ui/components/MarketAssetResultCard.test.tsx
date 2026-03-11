import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
  },
}));

import { MarketAssetResultCard } from './MarketAssetResultCard';

describe('MarketAssetResultCard', () => {
  it('renders the market asset payload, compare chips, and public link', () => {
    render(
      <MarketAssetResultCard
        locale="es"
        onRemove={vi.fn()}
        onFormSubmit={vi.fn()}
        toolMessage={{
          id: 'tool-1',
          timestamp: Date.now(),
          type: 'dynamic_card',
          data: {
            cardId: 'market_asset_lookup',
            description: 'Cotizacion actual desde Gold-API.',
            message: 'Bitcoin (BTC) cotiza en US$ 70.518,94 usd por unidad.',
            details: [
              { label: 'Activo', value: 'Bitcoin (BTC)' },
              { label: 'Precio', value: 'US$ 70.518,94 usd por unidad' },
              { label: 'Actualizado', value: 'a few seconds ago' },
              { label: 'Comparar con', value: 'XAU, XAG' },
              { label: 'Pagina publica', value: '/mercados/btc' },
            ],
          },
        }}
      />
    );

    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('Cotizacion actual')).toBeInTheDocument();
    expect(screen.getByText('En vivo')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver activo/i })).toHaveAttribute(
      'href',
      '/mercados/btc'
    );
    expect(screen.getAllByText('XAU').length).toBeGreaterThan(0);
    expect(screen.getAllByText('XAG').length).toBeGreaterThan(0);
  });

  it('returns null for other card types and handles empty detail blocks', () => {
    const { container, rerender } = render(
      <MarketAssetResultCard
        locale="en"
        onRemove={vi.fn()}
        onFormSubmit={vi.fn()}
        toolMessage={{
          id: 'tool-2',
          timestamp: Date.now(),
          type: 'error',
          data: {},
        }}
      />
    );

    expect(container).toBeEmptyDOMElement();

    rerender(
      <MarketAssetResultCard
        locale="en"
        onRemove={vi.fn()}
        onFormSubmit={vi.fn()}
        toolMessage={{
          id: 'tool-3',
          timestamp: Date.now(),
          type: 'dynamic_card',
          data: {
            cardId: 'market_asset_lookup',
            details: [
              { label: 'Asset', value: 'Copper' },
              { label: 'Price', value: '' },
            ],
          },
        }}
      />
    );

    expect(screen.getByText('Copper')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /open asset/i })).not.toBeInTheDocument();
  });
});
