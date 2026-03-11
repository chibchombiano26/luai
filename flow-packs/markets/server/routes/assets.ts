import {
  getFallbackMarketAssets,
  listMarketAssets,
  isCryptoMarketAsset,
} from '@packs/markets/shared/gold-api';
import { getMarketPackSettings } from '@packs/markets/shared/settings';
import { responseJson } from '@packs/markets/shared/access';

export async function GET() {
  try {
    const [settings, resolvedAssets] = await Promise.all([
      getMarketPackSettings(),
      listMarketAssets().catch(() => getFallbackMarketAssets()),
    ]);
    const assets = settings.showCryptoAssets
      ? resolvedAssets
      : resolvedAssets.filter((asset) => !isCryptoMarketAsset(asset.symbol));

    return responseJson({
      assets,
      settings,
    });
  } catch (error) {
    console.error('Market assets GET error:', error);
    return responseJson({ error: 'Failed to load market assets' }, 500);
  }
}
