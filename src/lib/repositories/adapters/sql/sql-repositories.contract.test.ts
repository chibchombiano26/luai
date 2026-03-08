import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSqlRepositories } from '@/lib/repositories/adapters/sql/create-sql-repositories';
import type { DbInterface } from '@/lib/db';

function createMockDb(overrides: Partial<DbInterface> = {}): DbInterface {
  return {
    get: vi.fn().mockResolvedValue(undefined),
    all: vi.fn().mockResolvedValue([]),
    run: vi.fn().mockResolvedValue(undefined),
    exec: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('sql repository contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('platform settings repository reads and saves by id', async () => {
    const db = createMockDb({
      get: vi
        .fn()
        .mockResolvedValueOnce({
          id: 'default',
          config: '{"a":1}',
          updated_at: '2026-03-07 10:00:00',
        })
        .mockResolvedValueOnce({ id: 'default' }),
    });
    const repositories = createSqlRepositories({ getDb: async () => db });

    await expect(repositories.platformSettings.findById('default')).resolves.toEqual({
      id: 'default',
      config: '{"a":1}',
      updatedAt: '2026-03-07 10:00:00',
    });

    await repositories.platformSettings.save('default', '{"a":2}');

    expect(db.run).toHaveBeenCalledWith(
      'UPDATE platform_settings SET config = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['{"a":2}', 'default']
    );
  });

  it('ai provider secret repository reads, updates and deletes by provider id', async () => {
    const db = createMockDb({
      get: vi
        .fn()
        .mockResolvedValueOnce({
          provider_id: 'gemini',
          secret: 'stored-secret',
          updated_at: '2026-03-07 10:00:00',
        })
        .mockResolvedValueOnce({ provider_id: 'gemini' }),
    });
    const repositories = createSqlRepositories({ getDb: async () => db });

    await expect(repositories.aiProviderSecrets.findByProviderId('gemini')).resolves.toEqual({
      providerId: 'gemini',
      secret: 'stored-secret',
      updatedAt: '2026-03-07 10:00:00',
    });

    await repositories.aiProviderSecrets.save('gemini', 'new-secret');
    await repositories.aiProviderSecrets.delete('gemini');

    expect(db.run).toHaveBeenNthCalledWith(
      1,
      'UPDATE ai_provider_secrets SET secret = ?, updated_at = CURRENT_TIMESTAMP WHERE provider_id = ?',
      ['new-secret', 'gemini']
    );
    expect(db.run).toHaveBeenNthCalledWith(
      2,
      'DELETE FROM ai_provider_secrets WHERE provider_id = ?',
      ['gemini']
    );
  });

  it('usage event repository records and aggregates usage data', async () => {
    const db = createMockDb({
      get: vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ totalQuotes: 4 })
        .mockResolvedValueOnce({
          totalRequests: 3,
          totalInputTokens: 100,
          totalOutputTokens: 200,
          totalTokens: 300,
        })
        .mockResolvedValueOnce({ totalRequests: 2, totalTokens: 250 })
        .mockResolvedValueOnce({ totalRequests: 3 })
        .mockResolvedValueOnce(undefined),
      all: vi
        .fn()
        .mockResolvedValueOnce([{ day: '2026-03-07', requests: 2, totalTokens: 250 }])
        .mockResolvedValueOnce([
          {
            id: 'usage_1',
            createdAt: '2026-03-07 10:00:00',
            model: 'gemini',
            locale: 'es',
            sessionId: null,
            inputTokens: 40,
            outputTokens: 60,
            totalTokens: 100,
          },
        ]),
    });
    const repositories = createSqlRepositories({ getDb: async () => db });

    await repositories.usageEvents.insertUsageEvent({
      id: 'usage_1',
      username: 'anonymous',
      model: 'gemini',
      locale: 'es',
      sessionId: null,
      inputTokens: 40,
      outputTokens: 60,
      totalTokens: 100,
    });
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

    await expect(repositories.usageEvents.getQuoteAggregateByUsername('anonymous')).resolves.toEqual({
      totalQuotes: 4,
    });
    await expect(repositories.usageEvents.getUsageAggregateByUsername('anonymous')).resolves.toEqual({
      totalRequests: 3,
      totalInputTokens: 100,
      totalOutputTokens: 200,
      totalTokens: 300,
    });
    await expect(repositories.usageEvents.getLast30DayUsageByUsername('anonymous')).resolves.toEqual({
      totalRequests: 2,
      totalTokens: 250,
    });
    await expect(repositories.usageEvents.getUsageRequestCountByUsername('anonymous')).resolves.toBe(3);
    await expect(repositories.usageEvents.listDailyUsageByUsername('anonymous')).resolves.toEqual([
      { day: '2026-03-07', requests: 2, totalTokens: 250 },
    ]);
    await expect(repositories.usageEvents.listRecentUsageByUsername('anonymous', 20)).resolves.toEqual([
      {
        id: 'usage_1',
        createdAt: '2026-03-07 10:00:00',
        model: 'gemini',
        locale: 'es',
        sessionId: null,
        inputTokens: 40,
        outputTokens: 60,
        totalTokens: 100,
      },
    ]);

    expect(db.run).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO ai_usage_events'),
      ['usage_1', 'anonymous', 'gemini', 'es', null, 40, 60, 100]
    );
    expect(db.run).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO ai_quote_events'),
      ['quote_1', 'anonymous', 'gemini', 'es', null, 1]
    );
    expect(db.run).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('INSERT INTO ai_quote_events'),
      ['quote_backfill', 'anonymous', 'legacy-backfill', 'es', null, 2]
    );
  });
});
