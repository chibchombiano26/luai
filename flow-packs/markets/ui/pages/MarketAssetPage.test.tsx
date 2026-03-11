import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../components/PublicMarketAssetExplorer', () => ({
  PublicMarketAssetExplorer: ({
    locale,
    initialSymbol,
  }: {
    locale: 'es' | 'en';
    initialSymbol?: string;
  }) => <div>{`explorer-${locale}-${initialSymbol ?? 'none'}`}</div>,
}));

import MarketAssetPage from './MarketAssetPage';

describe('MarketAssetPage', () => {
  it('passes the resolved symbol to the explorer', async () => {
    render(
      await MarketAssetPage({
        params: Promise.resolve({ symbol: 'btc' }),
      })
    );

    expect(screen.getByText('explorer-es-btc')).toBeInTheDocument();
  });
});
