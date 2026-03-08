import type { PostgresClient } from '@/lib/database/postgres/client';
import type {
  DailyUsageRecord,
  QuoteAggregateRecord,
  RecentUsageEventRecord,
  UsageAggregateRecord,
  UsageEventRepository,
  UsageWindowRecord,
} from '@/lib/repositories/usage-event-repository';

export type ClientResolver = () => Promise<PostgresClient>;

export function createPostgresUsageEventRepository(options: {
  getClient: ClientResolver;
}): UsageEventRepository {
  const { getClient } = options;

  return {
    async insertUsageEvent(input): Promise<void> {
      const client = await getClient();
      await client.query(
        `INSERT INTO ai_usage_events
          (id, username, model, locale, session_id, input_tokens, output_tokens, total_tokens)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
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
    },

    async insertQuoteEvent(input): Promise<void> {
      const client = await getClient();
      await client.query(
        `INSERT INTO ai_quote_events
          (id, username, model, locale, session_id, quote_count)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [input.id, input.username, input.model, input.locale, input.sessionId, input.quoteCount]
      );
    },

    async getQuoteAggregateByUsername(username: string): Promise<QuoteAggregateRecord> {
      const client = await getClient();
      const result = await client.query<{ totalQuotes?: unknown }>(
        `SELECT COALESCE(SUM(quote_count), 0)::int AS "totalQuotes"
         FROM ai_quote_events
         WHERE username = $1`,
        [username]
      );
      return { totalQuotes: Number(result.rows[0]?.totalQuotes ?? 0) };
    },

    async getUsageAggregateByUsername(username: string): Promise<UsageAggregateRecord> {
      const client = await getClient();
      const result = await client.query<{
        totalRequests?: unknown;
        totalInputTokens?: unknown;
        totalOutputTokens?: unknown;
        totalTokens?: unknown;
      }>(
        `SELECT
           COUNT(*)::int AS "totalRequests",
           COALESCE(SUM(input_tokens), 0)::int AS "totalInputTokens",
           COALESCE(SUM(output_tokens), 0)::int AS "totalOutputTokens",
           COALESCE(SUM(total_tokens), 0)::int AS "totalTokens"
         FROM ai_usage_events
         WHERE username = $1`,
        [username]
      );

      return {
        totalRequests: Number(result.rows[0]?.totalRequests ?? 0),
        totalInputTokens: Number(result.rows[0]?.totalInputTokens ?? 0),
        totalOutputTokens: Number(result.rows[0]?.totalOutputTokens ?? 0),
        totalTokens: Number(result.rows[0]?.totalTokens ?? 0),
      };
    },

    async getLast30DayUsageByUsername(username: string): Promise<UsageWindowRecord> {
      const client = await getClient();
      const result = await client.query<{ totalRequests?: unknown; totalTokens?: unknown }>(
        `SELECT
           COUNT(*)::int AS "totalRequests",
           COALESCE(SUM(total_tokens), 0)::int AS "totalTokens"
         FROM ai_usage_events
         WHERE username = $1
           AND created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'`,
        [username]
      );

      return {
        totalRequests: Number(result.rows[0]?.totalRequests ?? 0),
        totalTokens: Number(result.rows[0]?.totalTokens ?? 0),
      };
    },

    async getUsageRequestCountByUsername(username: string): Promise<number> {
      const client = await getClient();
      const result = await client.query<{ totalRequests?: unknown }>(
        `SELECT COUNT(*)::int AS "totalRequests"
         FROM ai_usage_events
         WHERE username = $1`,
        [username]
      );
      return Number(result.rows[0]?.totalRequests ?? 0);
    },

    async getQuoteEventById(id: string): Promise<{ id: string } | null> {
      const client = await getClient();
      const result = await client.query<{ id?: unknown }>('SELECT id FROM ai_quote_events WHERE id = $1', [id]);
      return typeof result.rows[0]?.id === 'string' ? { id: result.rows[0].id } : null;
    },

    async insertLegacyQuoteBackfill(input): Promise<void> {
      const client = await getClient();
      await client.query(
        `INSERT INTO ai_quote_events
          (id, username, model, locale, session_id, quote_count)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [input.id, input.username, input.model, input.locale, input.sessionId, input.quoteCount]
      );
    },

    async listDailyUsageByUsername(username: string): Promise<DailyUsageRecord[]> {
      const client = await getClient();
      const result = await client.query<{ day?: unknown; requests?: unknown; totalTokens?: unknown }>(
        `SELECT
           TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day,
           COUNT(*)::int AS requests,
           COALESCE(SUM(total_tokens), 0)::int AS "totalTokens"
         FROM ai_usage_events
         WHERE username = $1
           AND created_at >= CURRENT_TIMESTAMP - INTERVAL '14 days'
         GROUP BY 1
         ORDER BY day DESC`,
        [username]
      );

      return result.rows
        .filter((row) => typeof row.day === 'string')
        .map((row) => ({
          day: row.day as string,
          requests: Number(row.requests ?? 0),
          totalTokens: Number(row.totalTokens ?? 0),
        }));
    },

    async listRecentUsageByUsername(username: string, limit: number): Promise<RecentUsageEventRecord[]> {
      const client = await getClient();
      const result = await client.query<{
        id?: unknown;
        createdAt?: unknown;
        model?: unknown;
        locale?: unknown;
        sessionId?: unknown;
        inputTokens?: unknown;
        outputTokens?: unknown;
        totalTokens?: unknown;
      }>(
        `SELECT
           id,
           created_at::text AS "createdAt",
           model,
           locale,
           session_id AS "sessionId",
           input_tokens AS "inputTokens",
           output_tokens AS "outputTokens",
           total_tokens AS "totalTokens"
         FROM ai_usage_events
         WHERE username = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [username, Math.max(0, Math.trunc(limit))]
      );

      return result.rows
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
    },
  };
}
