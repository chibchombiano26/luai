export function buildMarketAssetPagePath(symbol: string): string {
  const normalized = String(symbol ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `/flow/markets/${encodeURIComponent(normalized || 'XAU')}`;
}
