import { z } from 'zod';
import { AppLocale } from '@/lib/i18n';

export interface MarketAssetDefinition {
  symbol: string;
  name: string;
}

export interface MarketAssetQuote extends MarketAssetDefinition {
  price: number;
  updatedAt: string;
  updatedAtReadable: string;
  unitLabel: string;
}

const GOLD_API_BASE_URL = process.env.GOLD_API_BASE_URL?.trim() || 'https://api.gold-api.com';
const DEFAULT_TIMEOUT_MS = 10_000;
const CRYPTO_SYMBOLS = new Set(['BTC', 'ETH']);

const SYMBOLS_RESPONSE_SCHEMA = z.array(
  z.object({
    name: z.string().trim().min(1),
    symbol: z.string().trim().min(1),
  })
);

const PRICE_RESPONSE_SCHEMA = z.object({
  name: z.string().trim().min(1),
  price: z.number(),
  symbol: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
  updatedAtReadable: z.string().trim().min(1),
});

const FALLBACK_ASSETS: MarketAssetDefinition[] = [
  { symbol: 'XAU', name: 'Gold' },
  { symbol: 'XAG', name: 'Silver' },
  { symbol: 'XPT', name: 'Platinum' },
  { symbol: 'XPD', name: 'Palladium' },
  { symbol: 'HG', name: 'Copper' },
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
];

const MARKET_ASSET_ALIASES = new Map<string, string>([
  ['gold', 'XAU'],
  ['oro', 'XAU'],
  ['silver', 'XAG'],
  ['plata', 'XAG'],
  ['platinum', 'XPT'],
  ['platino', 'XPT'],
  ['palladium', 'XPD'],
  ['paladio', 'XPD'],
  ['copper', 'HG'],
  ['cobre', 'HG'],
  ['bitcoin', 'BTC'],
  ['btc', 'BTC'],
  ['ethereum', 'ETH'],
  ['eth', 'ETH'],
  ['xau', 'XAU'],
  ['xag', 'XAG'],
  ['xpt', 'XPT'],
  ['xpd', 'XPD'],
  ['hg', 'HG'],
]);

function normalizeSymbol(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function normalizeSearchText(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function createAbortError(): Error {
  const error = new Error('The operation was aborted.');
  error.name = 'AbortError';
  return error;
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error &&
      (error.name === 'AbortError' || error.name === 'CanceledError'))
  );
}

async function fetchJson<T>(
  path: string,
  options?: {
    signal?: AbortSignal;
    timeoutMs?: number;
  }
): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();

  options?.signal?.addEventListener('abort', onAbort, { once: true });

  try {
    const response = await fetch(`${GOLD_API_BASE_URL}${path}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Gold API request failed (${response.status})`);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (isAbortError(error)) {
      throw createAbortError();
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    options?.signal?.removeEventListener('abort', onAbort);
  }
}

function compareAssets(a: MarketAssetDefinition, b: MarketAssetDefinition): number {
  return a.name.localeCompare(b.name) || a.symbol.localeCompare(b.symbol);
}

function dedupeSymbols(symbols: readonly string[]): string[] {
  return [...new Set(symbols.map((symbol) => normalizeSymbol(symbol)).filter(Boolean))];
}

function getUnitLabel(symbol: string, locale: AppLocale = 'en'): string {
  if (CRYPTO_SYMBOLS.has(symbol)) {
    return locale === 'es' ? 'USD por unidad' : 'USD per unit';
  }

  return locale === 'es' ? 'USD por onza' : 'USD per ounce';
}

export function getFallbackMarketAssets(): MarketAssetDefinition[] {
  return FALLBACK_ASSETS.slice();
}

export function isCryptoMarketAsset(symbol: string): boolean {
  return CRYPTO_SYMBOLS.has(normalizeSymbol(symbol));
}

export async function listMarketAssets(options?: { signal?: AbortSignal }): Promise<MarketAssetDefinition[]> {
  const raw = await fetchJson<unknown>('/symbols', options);
  const parsed = SYMBOLS_RESPONSE_SCHEMA.parse(raw);

  return parsed
    .map((asset) => ({
      symbol: normalizeSymbol(asset.symbol),
      name: asset.name.trim(),
    }))
    .sort(compareAssets);
}

export async function getMarketAssetQuote(
  symbol: string,
  options?: { signal?: AbortSignal; locale?: AppLocale }
): Promise<MarketAssetQuote> {
  const normalizedSymbol = normalizeSymbol(symbol);
  if (!normalizedSymbol) {
    throw new Error('Asset symbol is required.');
  }

  const raw = await fetchJson<unknown>(`/price/${encodeURIComponent(normalizedSymbol)}`, options);
  const parsed = PRICE_RESPONSE_SCHEMA.parse(raw);

  return {
    symbol: normalizeSymbol(parsed.symbol),
    name: parsed.name.trim(),
    price: parsed.price,
    updatedAt: parsed.updatedAt,
    updatedAtReadable: parsed.updatedAtReadable,
    unitLabel: getUnitLabel(normalizeSymbol(parsed.symbol), options?.locale ?? 'en'),
  };
}

export function resolveMarketAssetSymbol(
  query: string,
  assets: readonly MarketAssetDefinition[] = FALLBACK_ASSETS
): string | null {
  const normalized = normalizeSymbol(query);
  if (!normalized && !query.trim()) {
    return null;
  }

  const assetsBySymbol = new Map(
    assets.map((asset) => [normalizeSymbol(asset.symbol), normalizeSymbol(asset.symbol)])
  );

  if (normalized && assetsBySymbol.has(normalized)) {
    return normalized;
  }

  const lowered = query.trim().toLowerCase();
  const aliasMatch = MARKET_ASSET_ALIASES.get(lowered);
  if (aliasMatch && assetsBySymbol.has(aliasMatch)) {
    return aliasMatch;
  }

  const byName = assets.find((asset) => asset.name.trim().toLowerCase() === lowered);
  return byName ? normalizeSymbol(byName.symbol) : null;
}

export function findMarketAssetSymbolInText(
  text: string,
  assets: readonly MarketAssetDefinition[] = FALLBACK_ASSETS
): string | null {
  const directMatch = resolveMarketAssetSymbol(text, assets);
  if (directMatch) {
    return directMatch;
  }

  const normalizedText = normalizeSearchText(text);
  if (!normalizedText) {
    return null;
  }

  const assetsBySymbol = new Map(
    assets.map((asset) => [normalizeSymbol(asset.symbol), normalizeSymbol(asset.symbol)])
  );

  const escapedAliases = Array.from(MARKET_ASSET_ALIASES.keys())
    .sort((a, b) => b.length - a.length)
    .map((alias) => alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const aliasPattern = new RegExp(`\\b(${escapedAliases.join('|')})\\b`, 'i');
  const aliasMatch = normalizedText.match(aliasPattern);
  if (aliasMatch) {
    const resolvedAlias = MARKET_ASSET_ALIASES.get(aliasMatch[1].toLowerCase());
    if (resolvedAlias && assetsBySymbol.has(resolvedAlias)) {
      return resolvedAlias;
    }
  }

  for (const asset of assets) {
    const normalizedName = normalizeSearchText(asset.name);
    if (normalizedName && normalizedText.includes(normalizedName)) {
      return normalizeSymbol(asset.symbol);
    }
  }

  for (const token of normalizedText.split(' ')) {
    const normalizedToken = normalizeSymbol(token);
    if (normalizedToken && assetsBySymbol.has(normalizedToken)) {
      return normalizedToken;
    }
  }

  return null;
}

export function sanitizeMarketSymbolList(symbols: readonly string[]): string[] {
  return dedupeSymbols(symbols);
}
