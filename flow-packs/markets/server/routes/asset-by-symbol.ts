import {
  getFallbackMarketAssets,
  getMarketAssetQuote,
  listMarketAssets,
  resolveMarketAssetSymbol,
} from '@packs/markets/shared/gold-api';
import { getMarketPackSettings } from '@packs/markets/shared/settings';
import { responseJson } from '@packs/markets/shared/access';

export async function GET(
  request: Request,
  context: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol: rawSymbol } = await context.params;
    const [settings, resolvedAssets] = await Promise.all([
      getMarketPackSettings(),
      listMarketAssets().catch(() => getFallbackMarketAssets()),
    ]);
    const symbol =
      resolveMarketAssetSymbol(rawSymbol, resolvedAssets) ??
      resolveMarketAssetSymbol(settings.defaultSymbol, resolvedAssets);

    if (!symbol) {
      return responseJson({ error: 'Unknown market asset' }, 404);
    }

    const locale = request.headers.get('accept-language')?.toLowerCase().startsWith('es')
      ? 'es'
      : 'en';
    const compareSymbols = settings.featuredSymbols.filter((candidate) => candidate !== symbol).slice(0, 3);
    const [asset, compare] = await Promise.all([
      getMarketAssetQuote(symbol, { locale }),
      Promise.all(compareSymbols.map((candidate) => getMarketAssetQuote(candidate, { locale }))),
    ]);

    return responseJson({
      asset,
      compare,
      settings,
      availableSymbols: resolvedAssets.map((entry) => entry.symbol),
    });
  } catch (error) {
    console.error('Market asset by symbol GET error:', error);
    return responseJson({ error: 'Failed to load market asset' }, 500);
  }
}
