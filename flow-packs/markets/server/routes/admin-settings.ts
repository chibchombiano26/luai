import { z } from 'zod';
import {
  getFallbackMarketAssets,
  listMarketAssets,
} from '@packs/markets/shared/gold-api';
import {
  getMarketPackSettings,
  saveMarketPackSettings,
} from '@packs/markets/shared/settings';
import {
  ensureMarketAdminAccess,
  responseJson,
} from '@packs/markets/shared/access';

const UpdateMarketSettingsSchema = z.object({
  defaultSymbol: z.string().trim().min(1),
  featuredSymbols: z.array(z.string().trim().min(1)).min(1).max(8),
  refreshIntervalSeconds: z.number().int().min(10).max(300),
  showCryptoAssets: z.boolean(),
});

export async function GET(request: Request) {
  const authError = await ensureMarketAdminAccess(request);
  if (authError) {
    return authError;
  }

  try {
    const [settings, assets] = await Promise.all([
      getMarketPackSettings(),
      listMarketAssets().catch(() => getFallbackMarketAssets()),
    ]);

    return responseJson({
      settings,
      assets,
    });
  } catch (error) {
    console.error('Market admin settings GET error:', error);
    return responseJson({ error: 'Failed to load market settings' }, 500);
  }
}

export async function POST(request: Request) {
  const authError = await ensureMarketAdminAccess(request);
  if (authError) {
    return authError;
  }

  try {
    const body = await request.json();
    const parsed = UpdateMarketSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return responseJson(
        {
          error: 'Invalid market settings payload',
          details: parsed.error.flatten(),
        },
        400
      );
    }

    const settings = await saveMarketPackSettings(parsed.data);
    return responseJson({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Market admin settings POST error:', error);
    return responseJson({ error: 'Failed to save market settings' }, 500);
  }
}
