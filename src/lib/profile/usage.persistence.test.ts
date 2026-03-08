import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getRepositories } from '@/lib/repositories/repository-factory';
import {
  getFreeTierStatusForUser,
  getUsageSummaryForUser,
  recordQuoteEvent,
  recordUsageEvent,
} from './usage';

vi.mock('@/lib/repositories/repository-factory', () => ({
  getRepositories: vi.fn(),
}));

function buildUsageEventsMock() {
  return {
    insertUsageEvent: vi.fn().mockResolvedValue(undefined),
    insertQuoteEvent: vi.fn().mockResolvedValue(undefined),
    getQuoteAggregateByUsername: vi.fn().mockResolvedValue({ totalQuotes: 0 }),
    getUsageAggregateByUsername: vi.fn().mockResolvedValue({
      totalRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
    }),
    getLast30DayUsageByUsername: vi.fn().mockResolvedValue({
      totalRequests: 0,
      totalTokens: 0,
    }),
    getUsageRequestCountByUsername: vi.fn().mockResolvedValue(0),
    getQuoteEventById: vi.fn().mockResolvedValue(null),
    insertLegacyQuoteBackfill: vi.fn().mockResolvedValue(undefined),
    listDailyUsageByUsername: vi.fn().mockResolvedValue([]),
    listRecentUsageByUsername: vi.fn().mockResolvedValue([]),
  };
}

describe('usage persistence and aggregation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('recordUsageEvent normalizes and persists token values', async () => {
    const usageEvents = buildUsageEventsMock();
    vi.mocked(getRepositories).mockResolvedValue({ usageEvents } as never);

    await recordUsageEvent({
      username: 'anonymous',
      model: 'gemini',
      locale: 'es',
      sessionId: null,
      inputTokens: -10,
      outputTokens: 10.7,
      totalTokens: 20.2,
    });

    expect(usageEvents.insertUsageEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringMatching(/^usage_/),
        username: 'anonymous',
        model: 'gemini',
        locale: 'es',
        sessionId: null,
        inputTokens: 0,
        outputTokens: 11,
        totalTokens: 20,
      })
    );
  });

  it('recordQuoteEvent skips inserts when quoteCount is zero', async () => {
    const usageEvents = buildUsageEventsMock();
    vi.mocked(getRepositories).mockResolvedValue({ usageEvents } as never);

    await recordQuoteEvent({
      username: 'anonymous',
      model: 'gemini',
      locale: 'es',
      quoteCount: 0,
    });

    expect(usageEvents.insertQuoteEvent).not.toHaveBeenCalled();
  });

  it('recordQuoteEvent persists normalized quote count when positive', async () => {
    const usageEvents = buildUsageEventsMock();
    vi.mocked(getRepositories).mockResolvedValue({ usageEvents } as never);

    await recordQuoteEvent({
      username: 'anonymous',
      model: 'gemini',
      locale: 'es',
      sessionId: 'chat_1',
      quoteCount: 2.4,
    });

    expect(usageEvents.insertQuoteEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringMatching(/^quote_/),
        username: 'anonymous',
        model: 'gemini',
        locale: 'es',
        sessionId: 'chat_1',
        quoteCount: 2,
      })
    );
  });

  it('getUsageSummaryForUser maps repository aggregates and rows', async () => {
    const usageEvents = buildUsageEventsMock();
    usageEvents.getQuoteAggregateByUsername.mockResolvedValue({ totalQuotes: 2 });
    usageEvents.getUsageAggregateByUsername.mockResolvedValue({
      totalRequests: 3,
      totalInputTokens: 100,
      totalOutputTokens: 200,
      totalTokens: 300,
    });
    usageEvents.getLast30DayUsageByUsername.mockResolvedValue({
      totalRequests: 2,
      totalTokens: 250,
    });
    usageEvents.listDailyUsageByUsername.mockResolvedValue([
      { day: '2026-02-25', requests: 2, totalTokens: 250 },
    ]);
    usageEvents.listRecentUsageByUsername.mockResolvedValue([
      {
        id: 'usage_1',
        createdAt: '2026-02-25 12:00:00',
        model: 'gemini',
        locale: 'es',
        sessionId: null,
        inputTokens: 40,
        outputTokens: 60,
        totalTokens: 100,
      },
    ]);
    vi.mocked(getRepositories).mockResolvedValue({ usageEvents } as never);

    const summary = await getUsageSummaryForUser('anonymous');

    expect(summary).toEqual({
      username: 'anonymous',
      totalRequests: 3,
      totalQuotes: 2,
      totalInputTokens: 100,
      totalOutputTokens: 200,
      totalTokens: 300,
      last30DaysTokens: 250,
      last30DaysRequests: 2,
      dailyUsage: [{ day: '2026-02-25', requests: 2, totalTokens: 250 }],
      recentEvents: [
        {
          id: 'usage_1',
          createdAt: '2026-02-25 12:00:00',
          model: 'gemini',
          locale: 'es',
          sessionId: null,
          inputTokens: 40,
          outputTokens: 60,
          totalTokens: 100,
        },
      ],
    });
    expect(usageEvents.insertLegacyQuoteBackfill).not.toHaveBeenCalled();
    expect(usageEvents.getUsageRequestCountByUsername).not.toHaveBeenCalled();
  });

  it('getFreeTierStatusForUser evaluates anonymous limits from usage summary', async () => {
    const usageEvents = buildUsageEventsMock();
    usageEvents.getQuoteAggregateByUsername.mockResolvedValue({ totalQuotes: 55 });
    usageEvents.getUsageAggregateByUsername.mockResolvedValue({
      totalRequests: 3,
      totalInputTokens: 1000000,
      totalOutputTokens: 2500000,
      totalTokens: 3500000,
    });
    usageEvents.getLast30DayUsageByUsername.mockResolvedValue({
      totalRequests: 3,
      totalTokens: 3500000,
    });
    vi.mocked(getRepositories).mockResolvedValue({ usageEvents } as never);

    const status = await getFreeTierStatusForUser('anonymous');

    expect(status.isAnonymous).toBe(true);
    expect(status.hasReachedTokenLimit).toBe(true);
    expect(status.hasReachedQuoteLimit).toBe(true);
    expect(status.isLimited).toBe(true);
  });

  it('coerces missing aggregate and row token fields to zero', async () => {
    const usageEvents = buildUsageEventsMock();
    usageEvents.getQuoteAggregateByUsername.mockResolvedValue(undefined);
    usageEvents.getUsageAggregateByUsername.mockResolvedValue(undefined);
    usageEvents.getLast30DayUsageByUsername.mockResolvedValue(undefined);
    usageEvents.listDailyUsageByUsername.mockResolvedValue([
      { day: '2026-02-20', requests: undefined, totalTokens: null } as never,
    ]);
    usageEvents.listRecentUsageByUsername.mockResolvedValue([
      {
        id: 'usage_1',
        createdAt: '2026-02-20 12:00:00',
        model: 'gemini',
        locale: 'es',
        sessionId: null,
        inputTokens: undefined,
        outputTokens: null,
        totalTokens: undefined,
      } as never,
    ]);
    vi.mocked(getRepositories).mockResolvedValue({ usageEvents } as never);

    const summary = await getUsageSummaryForUser('jose');

    expect(summary.totalRequests).toBe(0);
    expect(summary.totalQuotes).toBe(0);
    expect(summary.last30DaysRequests).toBe(0);
    expect(summary.last30DaysTokens).toBe(0);
    expect(summary.dailyUsage).toEqual([{ day: '2026-02-20', requests: 0, totalTokens: 0 }]);
    expect(summary.recentEvents).toEqual([
      expect.objectContaining({
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      }),
    ]);
  });
});
