import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { getMarketAssetTone, MarketAssetGlyph } from './MarketAssetGlyph';

describe('MarketAssetGlyph', () => {
  it('returns tone classes for known and unknown assets', () => {
    expect(getMarketAssetTone('XAU').iconClassName).toContain('amber');
    expect(getMarketAssetTone('BTC').badgeClassName).toContain('orange');
    expect(getMarketAssetTone('ETH').badgeClassName).toContain('violet');
    expect(getMarketAssetTone('HG').badgeClassName).toContain('rose');
    expect(getMarketAssetTone('UNKNOWN').iconClassName).toContain('white');
  });

  it('renders an icon for known and fallback symbols', () => {
    const { container, rerender } = render(
      <MarketAssetGlyph symbol="BTC" className="h-6 w-6" iconClassName="tone" />
    );

    expect(container.querySelector('svg')).toHaveClass('h-6', 'w-6', 'tone');

    rerender(<MarketAssetGlyph symbol="ZZZ" iconClassName="fallback" />);
    expect(container.querySelector('svg')).toHaveClass('fallback');
  });
});
