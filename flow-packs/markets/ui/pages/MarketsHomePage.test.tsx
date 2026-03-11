import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../components/PublicMarketAssetExplorer', () => ({
  PublicMarketAssetExplorer: ({ locale }: { locale: 'es' | 'en' }) => (
    <div>{`explorer-${locale}`}</div>
  ),
}));

import MarketsHomePage from './MarketsHomePage';

describe('MarketsHomePage', () => {
  it('renders the public explorer in spanish', () => {
    render(<MarketsHomePage />);

    expect(screen.getByText('explorer-es')).toBeInTheDocument();
  });
});
