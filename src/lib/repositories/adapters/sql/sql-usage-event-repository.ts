import type { DbInterface } from '@/lib/db';
import type {
  DailyUsageRecord,
  QuoteAggregateRecord,
  RecentUsageEventRecord,
  UsageAggregateRecord,
  UsageEventRepository,
  UsageWindowRecord,
} from '@/lib/repositories/usage-event-repository';

export type DbResolver = () => Promise<DbInterface>;

export function createSqlUsageEventRepository(options: { getDb: DbResolver }): UsageEventRepository {
  const { getDb } = options;

  const insertUsageEvent = async (input: {
    id: string;
    username: string;
    model: string;
    locale: string;
    sessionId: string | null;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  }): Promise<void> => {
    const db = await getDb();
    await db.run(
      `INSERT INTO ai_usage_events
        (id, username, model, locale, session_id, input_tokens, output_tokens, total_tokens)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.id,
        input.username,
        input.model,
        input.locale,
        input.sessionId,
        input.inputTokens,
        input.outputTokens,
        input.totalTokens,
      ]
    );
  };

  const insertQuoteEvent = async (input: {
    id: string;
    username: string;
    model: string;
    locale: string;
    sessionId: string | null;
    quoteCount: number;
  }): Promise<void> => {
    const db = await getDb();
    await db.run(
      `INSERT INTO ai_quote_events
        (id, username, model, locale, session_id, quote_count)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [input.id, input.username, input.model, input.locale, input.sessionId, input.quoteCount]
    );
  };

  const getQuoteAggregateByUsername = async (username: string): Promise<QuoteAggregateRecord> => {
    const db = await getDb();
    const row = (await db.get(
      `SELECT COALESCE(SUM(quote_count), 0) AS totalQuotes
        FROM ai_quote_events
        WHERE username = ?`,
      [username]
    )) as { totalQuotes?: unknown } | undefined;

    return {
      totalQuotes: Number(row?.totalQuotes ?? 0),
    };
  };

  const getUsageAggregateByUsername = async (username: string): Promise<UsageAggregateRecord> => {
    const db = await getDb();
    const row = (await db.get(
      `SELECT
          COUNT(*) AS totalRequests,
          COALESCE(SUM(input_tokens), 0) AS totalInputTokens,
          COALESCE(SUM(output_tokens), 0) AS totalOutputTokens,
          COALESCE(SUM(total_tokens), 0) AS totalTokens
        FROM ai_usage_events
        WHERE username = ?`,
      [username]
    )) as
      | {
          totalRequests?: unknown;
          totalInputTokens?: unknown;
          totalOutputTokens?: unknown;
          totalTokens?: unknown;
        }
      | undefined;

    return {
      totalRequests: Number(row?.totalRequests ?? 0),
      totalInputTokens: Number(row?.totalInputTokens ?? 0),
      totalOutputTokens: Number(row?.totalOutputTokens ?? 0),
      totalTokens: Number(row?.totalTokens ?? 0),
    };
  };

  const getLast30DayUsageByUsername = async (username: string): Promise<UsageWindowRecord> => {
    const db = await getDb();
    const row = (await db.get(
      `SELECT
          COUNT(*) AS totalRequests,
          COALESCE(SUM(total_tokens), 0) AS totalTokens
        FROM ai_usage_events
        WHERE username = ?
          AND created_at >= datetime('now', '-30 days')`,
      [username]
    )) as { totalRequests?: unknown; totalTokens?: unknown } | undefined;

    return {
      totalRequests: Number(row?.totalRequests ?? 0),
      totalTokens: Number(row?.totalTokens ?? 0),
    };
  };

  const getUsageRequestCountByUsername = async (username: string): Promise<number> => {
    const db = await getDb();
    const row = (await db.get(
      `SELECT COUNT(*) AS totalRequests
        FROM ai_usage_events
        WHERE username = ?`,
      [username]
    )) as { totalRequests?: unknown } | undefined;

    return Number(row?.totalRequests ?? 0);
  };

  const getQuoteEventById = async (id: string): Promise<{ id: string } | null> => {
    const db = await getDb();
    const row = (await db.get('SELECT id FROM ai_quote_events WHERE id = ?', [id])) as
      | { id?: unknown }
      | undefined;

    return typeof row?.id === 'string' ? { id: row.id } : null;
  };

  const insertLegacyQuoteBackfill = async (input: {
    id: string;
    username: string;
    model: string;
    locale: string;
    sessionId: string | null;
    quoteCount: number;
  }): Promise<void> => {
    const existing = await getQuoteEventById(input.id);
    if (existing) {
      return;
    }

    await insertQuoteEvent(input);
  };

  const listDailyUsageByUsername = async (username: string): Promise<DailyUsageRecord[]> => {
    const db = await getDb();
    const rows = (await db.all(
      `SELECT
          strftime('%Y-%m-%d', created_at) AS day,
          COUNT(*) AS requests,
          COALESCE(SUM(total_tokens), 0) AS totalTokens
        FROM ai_usage_events
        WHERE username = ?
          AND created_at >= datetime('now', '-14 days')
        GROUP BY day
        ORDER BY day DESC`,
      [username]
    )) as Array<{ day?: unknown; requests?: unknown; totalTokens?: unknown }>;

    return rows
      .filter((row) => typeof row.day === 'string')
      .map((row) => ({
        day: row.day as string,
        requests: Number(row.requests ?? 0),
        totalTokens: Number(row.totalTokens ?? 0),
      }));
  };

  const listRecentUsageByUsername = async (
    username: string,
    limit: number
  ): Promise<RecentUsageEventRecord[]> => {
    const db = await getDb();
    const safeLimit = Math.max(0, Math.trunc(limit));
    const rows = (await db.all(
      `SELECT
          id,
          created_at AS createdAt,
          model,
          locale,
          session_id AS sessionId,
          input_tokens AS inputTokens,
          output_tokens AS outputTokens,
          total_tokens AS totalTokens
        FROM ai_usage_events
        WHERE username = ?
        ORDER BY created_at DESC
        LIMIT ${safeLimit}`,
      [username]
    )) as Array<{
      id?: unknown;
      createdAt?: unknown;
      model?: unknown;
      locale?: unknown;
      sessionId?: unknown;
      inputTokens?: unknown;
      outputTokens?: unknown;
      totalTokens?: unknown;
    }>;

    return rows
      .filter(
        (row) =>
          typeof row.id === 'string' &&
          typeof row.createdAt === 'string' &&
          typeof row.model === 'string' &&
          typeof row.locale === 'string'
      )
      .map((row) => ({
        id: row.id as string,
        createdAt: row.createdAt as string,
        model: row.model as string,
        locale: row.locale as string,
        sessionId: typeof row.sessionId === 'string' ? row.sessionId : null,
        inputTokens: Number(row.inputTokens ?? 0),
        outputTokens: Number(row.outputTokens ?? 0),
        totalTokens: Number(row.totalTokens ?? 0),
      }));
  };

  return {
    insertUsageEvent,
    insertQuoteEvent,
    getQuoteAggregateByUsername,
    getUsageAggregateByUsername,
    getLast30DayUsageByUsername,
    getUsageRequestCountByUsername,
    getQuoteEventById,
    insertLegacyQuoteBackfill,
    listDailyUsageByUsername,
    listRecentUsageByUsername,
  };
}
