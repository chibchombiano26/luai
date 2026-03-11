import { z } from 'zod';
import {
  getFallbackMarketAssets,
  listMarketAssets,
} from '@packs/markets/shared/gold-api';
import {
  getMarketPackSettings,
  getStoredMarketProfilePreferences,
  saveStoredMarketProfilePreferences,
} from '@packs/markets/shared/settings';
import {
  resolveMarketUserContext,
  responseJson,
} from '@packs/markets/shared/access';

const UpdateMarketPreferencesSchema = z.object({
  defaultSymbol: z.string().trim().min(1),
  favoriteSymbols: z.array(z.string().trim().min(1)).max(10),
  compactView: z.boolean(),
});

export async function GET(request: Request) {
  try {
    const context = await resolveMarketUserContext(request);
    if (context instanceof Response) {
      return context;
    }

    const [settings, assets] = await Promise.all([
      getMarketPackSettings(),
      listMarketAssets().catch(() => getFallbackMarketAssets()),
    ]);
    const preferences = await getStoredMarketProfilePreferences(context.username, settings);

    return responseJson({
      preferences,
      settings,
      assets,
    });
  } catch (error) {
    console.error('Market preferences GET error:', error);
    return responseJson({ error: 'Failed to load market preferences' }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const context = await resolveMarketUserContext(request);
    if (context instanceof Response) {
      return context;
    }

    const [body, settings] = await Promise.all([request.json(), getMarketPackSettings()]);
    const parsed = UpdateMarketPreferencesSchema.safeParse(body);

    if (!parsed.success) {
      return responseJson(
        {
          error: 'Invalid market preferences payload',
          details: parsed.error.flatten(),
        },
        400
      );
    }

    const preferences = await saveStoredMarketProfilePreferences(
      context.username,
      parsed.data,
      settings
    );

    return responseJson({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Market preferences POST error:', error);
    return responseJson({ error: 'Failed to save market preferences' }, 500);
  }
}
