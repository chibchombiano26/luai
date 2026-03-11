import { z } from 'zod';
import type { FlowPackChatModule, FlowPackServerModule } from '@/lib/platform/pack-server';
import type { ToolContext } from '@/app/api/chat/agent-tools-types';
import {
  findMarketAssetSymbolInText,
  getFallbackMarketAssets,
  getMarketAssetQuote,
  resolveMarketAssetSymbol,
  sanitizeMarketSymbolList,
} from '@packs/markets/shared/gold-api';
import { buildMarketAssetPagePath } from '@packs/markets/shared/routes';

const inputSchema = z.object({
  symbol: z.string().optional(),
  asset: z.string().optional(),
  query: z.string().optional(),
});

function resolveConfiguredCompareSymbols(value: unknown): string[] {
  if (Array.isArray(value)) {
    return sanitizeMarketSymbolList(value.map((item) => String(item)));
  }

  if (typeof value === 'string') {
    return sanitizeMarketSymbolList(value.split(','));
  }

  return [];
}

function formatPrice(value: number, locale: 'es' | 'en'): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es-CO' : 'en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1000 ? 2 : 4,
  }).format(value);
}

function buildSummary(params: {
  locale: 'es' | 'en';
  name: string;
  symbol: string;
  price: number;
  unitLabel: string;
}): string {
  if (params.locale === 'es') {
    return `${params.name} (${params.symbol}) cotiza en ${formatPrice(params.price, 'es')} ${params.unitLabel.toLowerCase()}.`;
  }

  return `${params.name} (${params.symbol}) is trading at ${formatPrice(params.price, 'en')} ${params.unitLabel.toLowerCase()}.`;
}

export function show_market_asset(context: ToolContext) {
  const locale = context.isEnglish ? 'en' : 'es';
  const cardConfig = context.cardConfigById?.market_asset_lookup ?? {};

  return {
    description: context.isEnglish
      ? 'Get the current quote for a market asset such as gold, silver, copper, bitcoin, or ethereum'
      : 'Obtener la cotizacion actual de un activo como oro, plata, cobre, bitcoin o ethereum',
    inputSchema,
    execute: async (args: z.infer<typeof inputSchema>) => {
      const fallbackAssets = getFallbackMarketAssets();
      const query =
        args.symbol?.trim() ||
        args.asset?.trim() ||
        args.query?.trim() ||
        '';
      const symbol =
        resolveMarketAssetSymbol(query, fallbackAssets) ??
        findMarketAssetSymbolInText(query, fallbackAssets);

      if (!symbol) {
        return {
          type: 'error',
          message: context.isEnglish
            ? 'Please provide a valid asset such as gold, silver, copper, bitcoin, or ethereum.'
            : 'Indica un activo valido como oro, plata, cobre, bitcoin o ethereum.',
        };
      }

      try {
        const quote = await getMarketAssetQuote(symbol, {
          signal: context.abortSignal,
          locale,
        });
        const compareSymbols = resolveConfiguredCompareSymbols(cardConfig.compareSymbols).filter(
          (candidate) => candidate !== quote.symbol
        );
        const assetPagePath = buildMarketAssetPagePath(quote.symbol);

        return {
          type: 'dynamic_card',
          cardId: 'market_asset_lookup',
          title: locale === 'es' ? 'Activo de mercado' : 'Market asset',
          description:
            locale === 'es'
              ? 'Cotizacion actual desde Gold-API.'
              : 'Current quote powered by Gold-API.',
          message: buildSummary({
            locale,
            name: quote.name,
            symbol: quote.symbol,
            price: quote.price,
            unitLabel: quote.unitLabel,
          }),
          details: [
            {
              label: locale === 'es' ? 'Activo' : 'Asset',
              value: `${quote.name} (${quote.symbol})`,
            },
            {
              label: locale === 'es' ? 'Precio' : 'Price',
              value: `${formatPrice(quote.price, locale)} ${quote.unitLabel.toLowerCase()}`,
            },
            {
              label: locale === 'es' ? 'Actualizado' : 'Updated',
              value: quote.updatedAtReadable,
            },
            ...(compareSymbols.length > 0
              ? [
                  {
                    label: locale === 'es' ? 'Comparar con' : 'Compare with',
                    value: compareSymbols.join(', '),
                  },
                ]
              : []),
            {
              label: locale === 'es' ? 'Pagina publica' : 'Public page',
              value: assetPagePath,
            },
          ],
        };
      } catch (error) {
        if (
          error instanceof Error &&
          (error.name === 'AbortError' || error.name === 'CanceledError')
        ) {
          throw error;
        }

        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          type: 'error',
          message: context.isEnglish
            ? `Error retrieving market asset: ${errorMessage}`
            : `Error al consultar el activo de mercado: ${errorMessage}`,
        };
      }
    },
  };
}

export const chat: FlowPackChatModule = {
  async resolveRuntime({ requestContext }) {
    const detectedSymbol = findMarketAssetSymbolInText(requestContext.normalizedLastUserMessage);
    if (!detectedSymbol) {
      return null;
    }

    return {
      allowedToolIds: ['show_market_asset'],
    };
  },
};

export const tools: FlowPackServerModule['tools'] = {
  show_market_asset,
};
