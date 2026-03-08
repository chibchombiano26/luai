import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPostgresRepositories } from '@/lib/repositories/adapters/postgres/create-postgres-repositories';

function createMockClient() {
  return {
    query: vi.fn().mockResolvedValue({ rows: [] }),
    end: vi.fn().mockResolvedValue(undefined),
  };
}

describe('postgres repository contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('platform settings repository uses postgres parameter placeholders and upsert', async () => {
    const client = createMockClient();
    client.query
      .mockResolvedValueOnce({
        rows: [{ id: 'default', config: '{"a":1}', updated_at: '2026-03-07 10:00:00' }],
      })
      .mockResolvedValueOnce({ rows: [] });
    const repositories = createPostgresRepositories({ getClient: async () => client });

    await expect(repositories.platformSettings.findById('default')).resolves.toEqual({
      id: 'default',
      config: '{"a":1}',
      updatedAt: '2026-03-07 10:00:00',
    });

    await repositories.platformSettings.save('default', '{"a":2}');

    expect(client.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('ON CONFLICT (id) DO UPDATE'),
      ['default', '{"a":2}']
    );
  });

  it('usage event repository uses postgres-specific date and conflict syntax', async () => {
    const client = createMockClient();
    client.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ totalQuotes: 2 }] })
      .mockResolvedValueOnce({ rows: [{ totalRequests: 1, totalTokens: 10 }] })
      .mockResolvedValueOnce({ rows: [{ day: '2026-03-07', requests: 1, totalTokens: 10 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'usage_1',
            createdAt: '2026-03-07 10:00:00',
            model: 'gemini',
            locale: 'es',
            sessionId: null,
            inputTokens: 4,
            outputTokens: 6,
            totalTokens: 10,
          },
        ],
      });
    const repositories = createPostgresRepositories({ getClient: async () => client });

    await repositories.usageEvents.insertQuoteEvent({
      id: 'quote_1',
      username: 'anonymous',
      model: 'gemini',
      locale: 'es',
      sessionId: null,
      quoteCount: 1,
    });
    await repositories.usageEvents.insertLegacyQuoteBackfill({
      id: 'quote_backfill',
      username: 'anonymous',
      model: 'legacy-backfill',
      locale: 'es',
      sessionId: null,
      quoteCount: 2,
    });
    await repositories.usageEvents.getQuoteAggregateByUsername('anonymous');
    await repositories.usageEvents.getLast30DayUsageByUsername('anonymous');
    await repositories.usageEvents.listDailyUsageByUsername('anonymous');
    await repositories.usageEvents.listRecentUsageByUsername('anonymous', 20);

    expect(client.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('ON CONFLICT (id) DO NOTHING'),
      ['quote_backfill', 'anonymous', 'legacy-backfill', 'es', null, 2]
    );
    expect(client.query).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining("CURRENT_TIMESTAMP - INTERVAL '30 days'"),
      ['anonymous']
    );
    expect(client.query).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining("TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD')"),
      ['anonymous']
    );
    expect(client.query).toHaveBeenNthCalledWith(
      6,
      expect.stringContaining('LIMIT $2'),
      ['anonymous', 20]
    );
  });
});
