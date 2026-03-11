import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MarketAssetCard } from './MarketAssetCard';

describe('MarketAssetCard', () => {
  const asset = {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 70518.94,
    updatedAt: '2026-03-11T16:00:00Z',
    updatedAtReadable: 'a few seconds ago',
    unitLabel: 'usd por unidad',
  };

  it('renders the asset summary without a link', () => {
    render(<MarketAssetCard asset={asset} locale="es" />);

    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText(/US\$/)).toBeInTheDocument();
    expect(screen.getByText('usd por unidad')).toBeInTheDocument();
    expect(screen.getByText('a few seconds ago')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('wraps the card in a link and falls back to raw timestamp when invalid', () => {
    render(
      <MarketAssetCard
        asset={{ ...asset, updatedAt: 'not-a-date' }}
        locale="en"
        href="/mercados/btc"
        compact
      />
    );

    expect(screen.getByRole('link')).toHaveAttribute('href', '/mercados/btc');
    expect(screen.getByText('Spot')).toBeInTheDocument();
    expect(screen.getByText('not-a-date')).toBeInTheDocument();
  });
});
