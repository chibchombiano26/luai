import { describe, expect, it } from 'vitest';
import {
  FREE_TIER_QUOTE_LIMIT,
  FREE_TIER_TOKEN_LIMIT,
  evaluateFreeTierStatus,
} from './usage';

describe('evaluateFreeTierStatus', () => {
  it('marks anonymous user as limited when quote threshold is reached', () => {
    const status = evaluateFreeTierStatus('anonymous', 1000, FREE_TIER_QUOTE_LIMIT);

    expect(status.isAnonymous).toBe(true);
    expect(status.hasReachedQuoteLimit).toBe(true);
    expect(status.isLimited).toBe(true);
    expect(status.remainingQuotes).toBe(0);
  });

  it('marks anonymous user as limited when token threshold is reached', () => {
    const status = evaluateFreeTierStatus('anonymous', FREE_TIER_TOKEN_LIMIT, 1);

    expect(status.hasReachedTokenLimit).toBe(true);
    expect(status.isLimited).toBe(true);
    expect(status.remainingTokens).toBe(0);
  });

  it('keeps authenticated users without free-tier blocking', () => {
    const status = evaluateFreeTierStatus('jose', FREE_TIER_TOKEN_LIMIT * 10, FREE_TIER_QUOTE_LIMIT * 10);

    expect(status.isAnonymous).toBe(false);
    expect(status.isLimited).toBe(false);
    expect(status.remainingTokens).toBeNull();
    expect(status.remainingQuotes).toBeNull();
  });
});
