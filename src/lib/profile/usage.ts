import { getRepositories } from '@/lib/repositories/repository-factory';
import type { UsageSummary } from './types';

export const FREE_TIER_TOKEN_LIMIT = 3_000_000;
export const FREE_TIER_QUOTE_LIMIT = 50;

export interface UsageEventInput {
  username: string;
  model: string;
  locale: 'es' | 'en';
  sessionId?: string | null;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface QuoteEventInput {
  username: string;
  model: string;
  locale: 'es' | 'en';
  sessionId?: string | null;
  quoteCount: number;
}

export interface FreeTierStatus {
  isAnonymous: boolean;
  usedTokens: number;
  usedQuotes: number;
  tokenLimit: number;
  quoteLimit: number;
  remainingTokens: number | null;
  remainingQuotes: number | null;
  hasReachedTokenLimit: boolean;
  hasReachedQuoteLimit: boolean;
  isLimited: boolean;
}

function normalizeTokenValue(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.round(value);
}

export async function recordUsageEvent(input: UsageEventInput): Promise<void> {
  const id = `usage_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const { usageEvents } = await getRepositories();
  await usageEvents.insertUsageEvent({
    id,
    username: input.username,
    model: input.model,
    locale: input.locale,
    sessionId: input.sessionId ?? null,
    inputTokens: normalizeTokenValue(input.inputTokens),
    outputTokens: normalizeTokenValue(input.outputTokens),
    totalTokens: normalizeTokenValue(input.totalTokens),
  });
}

export async function recordQuoteEvent(input: QuoteEventInput): Promise<void> {
  const quoteCount = normalizeTokenValue(input.quoteCount);
  if (quoteCount <= 0) {
    return;
  }

  const id = `quote_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const { usageEvents } = await getRepositories();
  await usageEvents.insertQuoteEvent({
    id,
    username: input.username,
    model: input.model,
    locale: input.locale,
    sessionId: input.sessionId ?? null,
    quoteCount,
  });
}

async function ensureLegacyQuoteBackfillForAnonymous(username: string): Promise<void> {
  if (username !== 'anonymous') {
    return;
  }
}

export function evaluateFreeTierStatus(
  username: string,
  usedTokens: number,
  usedQuotes: number
): FreeTierStatus {
  const normalizedTokens = normalizeTokenValue(usedTokens);
  const normalizedQuotes = normalizeTokenValue(usedQuotes);
  const isAnonymous = username === 'anonymous';

  if (!isAnonymous) {
    return {
      isAnonymous: false,
      usedTokens: normalizedTokens,
      usedQuotes: normalizedQuotes,
      tokenLimit: FREE_TIER_TOKEN_LIMIT,
      quoteLimit: FREE_TIER_QUOTE_LIMIT,
      remainingTokens: null,
      remainingQuotes: null,
      hasReachedTokenLimit: false,
      hasReachedQuoteLimit: false,
      isLimited: false,
    };
  }

  const remainingTokens = Math.max(FREE_TIER_TOKEN_LIMIT - normalizedTokens, 0);
  const remainingQuotes = Math.max(FREE_TIER_QUOTE_LIMIT - normalizedQuotes, 0);
  const hasReachedTokenLimit = normalizedTokens >= FREE_TIER_TOKEN_LIMIT;
  const hasReachedQuoteLimit = normalizedQuotes >= FREE_TIER_QUOTE_LIMIT;

  return {
    isAnonymous,
    usedTokens: normalizedTokens,
    usedQuotes: normalizedQuotes,
    tokenLimit: FREE_TIER_TOKEN_LIMIT,
    quoteLimit: FREE_TIER_QUOTE_LIMIT,
    remainingTokens,
    remainingQuotes,
    hasReachedTokenLimit,
    hasReachedQuoteLimit,
    isLimited: hasReachedTokenLimit || hasReachedQuoteLimit,
  };
}

export async function getUsageSummaryForUser(username: string): Promise<UsageSummary> {
  await ensureLegacyQuoteBackfillForAnonymous(username);

  const { usageEvents } = await getRepositories();
  const aggregate = await usageEvents.getUsageAggregateByUsername(username);
  const quoteAggregate = await usageEvents.getQuoteAggregateByUsername(username);
  const last30 = await usageEvents.getLast30DayUsageByUsername(username);
  const dailyRows = await usageEvents.listDailyUsageByUsername(username);
  const recentRows = await usageEvents.listRecentUsageByUsername(username, 20);

  return {
    username,
    totalRequests: Number(aggregate?.totalRequests ?? 0),
    totalQuotes: Number(quoteAggregate?.totalQuotes ?? 0),
    totalInputTokens: Number(aggregate?.totalInputTokens ?? 0),
    totalOutputTokens: Number(aggregate?.totalOutputTokens ?? 0),
    totalTokens: Number(aggregate?.totalTokens ?? 0),
    last30DaysTokens: Number(last30?.totalTokens ?? 0),
    last30DaysRequests: Number(last30?.totalRequests ?? 0),
    dailyUsage: dailyRows.map((row) => ({
      day: row.day,
      requests: Number(row.requests ?? 0),
      totalTokens: Number(row.totalTokens ?? 0),
    })),
    recentEvents: recentRows.map((row) => ({
      ...row,
      inputTokens: Number(row.inputTokens ?? 0),
      outputTokens: Number(row.outputTokens ?? 0),
      totalTokens: Number(row.totalTokens ?? 0),
    })),
  };
}

export async function getFreeTierStatusForUser(username: string): Promise<FreeTierStatus> {
  const usage = await getUsageSummaryForUser(username);
  return evaluateFreeTierStatus(username, usage.totalTokens, usage.totalQuotes);
}
