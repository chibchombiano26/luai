import { getRepositories } from '@/lib/repositories/repository-factory';
import { getFallbackMarketAssets, isCryptoMarketAsset, sanitizeMarketSymbolList } from './gold-api';

export interface MarketPackSettings {
  defaultSymbol: string;
  featuredSymbols: string[];
  refreshIntervalSeconds: number;
  showCryptoAssets: boolean;
}

export interface MarketProfilePreferences {
  defaultSymbol: string;
  favoriteSymbols: string[];
  compactView: boolean;
}

const MARKET_PACK_SETTINGS_ROW_ID = 'market_asset_pack_settings';
const MARKET_PROFILE_PREFERENCES_ROW_PREFIX = 'market_profile_preferences:';

const DEFAULT_MARKET_PACK_SETTINGS: MarketPackSettings = {
  defaultSymbol: 'XAU',
  featuredSymbols: ['XAU', 'XAG', 'XPT', 'BTC'],
  refreshIntervalSeconds: 30,
  showCryptoAssets: true,
};

const DEFAULT_MARKET_PROFILE_PREFERENCES: MarketProfilePreferences = {
  defaultSymbol: 'XAU',
  favoriteSymbols: ['XAU', 'XAG'],
  compactView: false,
};

function resolveDefaultSymbolFallback(showCryptoAssets: boolean): string {
  const available = getFallbackMarketAssets()
    .map((asset) => asset.symbol)
    .filter((symbol) => showCryptoAssets || !isCryptoMarketAsset(symbol));
  return available[0] ?? 'XAU';
}

function clampRefreshIntervalSeconds(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_MARKET_PACK_SETTINGS.refreshIntervalSeconds;
  const normalized = Math.floor(parsed);
  if (normalized < 10) return 10;
  if (normalized > 300) return 300;
  return normalized;
}

function sanitizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function sanitizeSymbol(value: unknown): string | null {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  return normalized || null;
}

function normalizeWithVisibility(
  symbols: readonly string[],
  showCryptoAssets: boolean
): string[] {
  return sanitizeMarketSymbolList(symbols).filter(
    (symbol) => showCryptoAssets || !isCryptoMarketAsset(symbol)
  );
}

function resolveProfilePreferencesRowId(username: string | null): string {
  const normalizedUsername = (username ?? 'anonymous').trim() || 'anonymous';
  return `${MARKET_PROFILE_PREFERENCES_ROW_PREFIX}${encodeURIComponent(normalizedUsername)}`;
}

export function sanitizeMarketPackSettings(value: unknown): MarketPackSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...DEFAULT_MARKET_PACK_SETTINGS };
  }

  const candidate = value as Record<string, unknown>;
  const showCryptoAssets = sanitizeBoolean(
    candidate.showCryptoAssets,
    DEFAULT_MARKET_PACK_SETTINGS.showCryptoAssets
  );
  const featuredSymbols = normalizeWithVisibility(
    Array.isArray(candidate.featuredSymbols)
      ? candidate.featuredSymbols.map((symbol) => String(symbol))
      : DEFAULT_MARKET_PACK_SETTINGS.featuredSymbols,
    showCryptoAssets
  );
  const defaultSymbolCandidate =
    sanitizeSymbol(candidate.defaultSymbol) ?? resolveDefaultSymbolFallback(showCryptoAssets);
  const defaultSymbol =
    showCryptoAssets || !isCryptoMarketAsset(defaultSymbolCandidate)
      ? defaultSymbolCandidate
      : resolveDefaultSymbolFallback(showCryptoAssets);

  return {
    defaultSymbol,
    featuredSymbols:
      featuredSymbols.length > 0
        ? featuredSymbols.slice(0, 8)
        : [defaultSymbol, ...DEFAULT_MARKET_PACK_SETTINGS.featuredSymbols].slice(0, 4),
    refreshIntervalSeconds: clampRefreshIntervalSeconds(candidate.refreshIntervalSeconds),
    showCryptoAssets,
  };
}

export function sanitizeMarketProfilePreferences(
  value: unknown,
  settings: MarketPackSettings = DEFAULT_MARKET_PACK_SETTINGS
): MarketProfilePreferences {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {
      defaultSymbol: settings.defaultSymbol,
      favoriteSymbols: settings.featuredSymbols.slice(0, 3),
      compactView: DEFAULT_MARKET_PROFILE_PREFERENCES.compactView,
    };
  }

  const candidate = value as Record<string, unknown>;
  const favoriteSymbols = normalizeWithVisibility(
    Array.isArray(candidate.favoriteSymbols)
      ? candidate.favoriteSymbols.map((symbol) => String(symbol))
      : settings.featuredSymbols,
    settings.showCryptoAssets
  ).slice(0, 10);
  const defaultSymbolCandidate =
    sanitizeSymbol(candidate.defaultSymbol) ?? favoriteSymbols[0] ?? settings.defaultSymbol;
  const defaultSymbol =
    settings.showCryptoAssets || !isCryptoMarketAsset(defaultSymbolCandidate)
      ? defaultSymbolCandidate
      : settings.defaultSymbol;

  return {
    defaultSymbol,
    favoriteSymbols:
      favoriteSymbols.length > 0
        ? favoriteSymbols
        : settings.featuredSymbols.slice(0, 3),
    compactView: sanitizeBoolean(
      candidate.compactView,
      DEFAULT_MARKET_PROFILE_PREFERENCES.compactView
    ),
  };
}

export async function getMarketPackSettings(): Promise<MarketPackSettings> {
  const { platformSettings } = await getRepositories();
  const row = await platformSettings.findById(MARKET_PACK_SETTINGS_ROW_ID);

  if (!row) {
    await platformSettings.save(
      MARKET_PACK_SETTINGS_ROW_ID,
      JSON.stringify(DEFAULT_MARKET_PACK_SETTINGS)
    );
    return { ...DEFAULT_MARKET_PACK_SETTINGS };
  }

  try {
    return sanitizeMarketPackSettings(JSON.parse(row.config));
  } catch {
    return { ...DEFAULT_MARKET_PACK_SETTINGS };
  }
}

export async function saveMarketPackSettings(
  settings: MarketPackSettings
): Promise<MarketPackSettings> {
  const sanitized = sanitizeMarketPackSettings(settings);
  const { platformSettings } = await getRepositories();
  await platformSettings.save(MARKET_PACK_SETTINGS_ROW_ID, JSON.stringify(sanitized));
  return sanitized;
}

export async function getStoredMarketProfilePreferences(
  username: string | null,
  settings: MarketPackSettings
): Promise<MarketProfilePreferences> {
  const { platformSettings } = await getRepositories();
  const row = await platformSettings.findById(resolveProfilePreferencesRowId(username));

  if (!row) {
    return sanitizeMarketProfilePreferences(null, settings);
  }

  try {
    return sanitizeMarketProfilePreferences(JSON.parse(row.config), settings);
  } catch {
    return sanitizeMarketProfilePreferences(null, settings);
  }
}

export async function saveStoredMarketProfilePreferences(
  username: string | null,
  preferences: MarketProfilePreferences,
  settings: MarketPackSettings
): Promise<MarketProfilePreferences> {
  const sanitized = sanitizeMarketProfilePreferences(preferences, settings);
  const { platformSettings } = await getRepositories();
  await platformSettings.save(
    resolveProfilePreferencesRowId(username),
    JSON.stringify(sanitized)
  );
  return sanitized;
}
