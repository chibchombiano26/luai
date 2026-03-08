export interface UsageAggregateRecord {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
}

export interface QuoteAggregateRecord {
  totalQuotes: number;
}

export interface UsageWindowRecord {
  totalRequests: number;
  totalTokens: number;
}

export interface DailyUsageRecord {
  day: string;
  requests: number;
  totalTokens: number;
}

export interface RecentUsageEventRecord {
  id: string;
  createdAt: string;
  model: string;
  locale: string;
  sessionId: string | null;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface UsageEventRepository {
  insertUsageEvent(input: {
    id: string;
    username: string;
    model: string;
    locale: string;
    sessionId: string | null;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  }): Promise<void>;
  insertQuoteEvent(input: {
    id: string;
    username: string;
    model: string;
    locale: string;
    sessionId: string | null;
    quoteCount: number;
  }): Promise<void>;
  getQuoteAggregateByUsername(username: string): Promise<QuoteAggregateRecord>;
  getUsageAggregateByUsername(username: string): Promise<UsageAggregateRecord>;
  getLast30DayUsageByUsername(username: string): Promise<UsageWindowRecord>;
  getUsageRequestCountByUsername(username: string): Promise<number>;
  getQuoteEventById(id: string): Promise<{ id: string } | null>;
  insertLegacyQuoteBackfill(input: {
    id: string;
    username: string;
    model: string;
    locale: string;
    sessionId: string | null;
    quoteCount: number;
  }): Promise<void>;
  listDailyUsageByUsername(username: string): Promise<DailyUsageRecord[]>;
  listRecentUsageByUsername(username: string, limit: number): Promise<RecentUsageEventRecord[]>;
}
