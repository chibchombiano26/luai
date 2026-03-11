import { z } from 'zod';
import type { FlowPackChatModule, FlowPackServerModule } from '@/lib/platform/pack-server';
import type { ToolContext } from '@/app/api/chat/agent-tools-types';
import { getWeatherForecast, type WeatherUnits } from '@packs/weather/shared/open-meteo';

const inputSchema = z.object({
  location: z.string().min(2).optional(),
  date: z.string().optional(),
  units: z.enum(['metric', 'imperial']).optional(),
  notes: z.string().optional(),
});

function parseUnits(value: unknown): WeatherUnits | null {
  if (value === 'metric' || value === 'imperial') return value;
  return null;
}

function parseForecastDays(value: unknown): number | undefined {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.floor(parsed);
}

function resolveProvider(value: unknown): string {
  if (typeof value !== 'string') return 'open-meteo';
  return value.trim().toLowerCase();
}

const WEATHER_SCOPE_KEYWORDS = [
  'clima',
  'tiempo',
  'temperatura',
  'lluvia',
  'pronostico',
  'pronóstico',
  'forecast',
  'weather',
];

export function show_weather_forecast(context: ToolContext) {
  const { isEnglish, abortSignal } = context;
  const cardConfig = context.cardConfigById?.weather_forecast ?? {};

  return {
    description: isEnglish
      ? 'Get weather forecast using the Open-Meteo API'
      : 'Obtener pronóstico del clima usando la API de Open-Meteo',
    inputSchema,
    execute: async (args: z.infer<typeof inputSchema>) => {
      const configuredProvider = resolveProvider(cardConfig.provider);
      const supportedProviders = new Set(['open-meteo', 'open_meteo', 'openmeteo', 'openweather']);
      if (!supportedProviders.has(configuredProvider)) {
        return {
          type: 'error',
          message: isEnglish
            ? `Weather provider "${configuredProvider}" is not supported. Use open-meteo.`
            : `El proveedor de clima "${configuredProvider}" no es compatible. Usa open-meteo.`,
        };
      }

      const configuredDefaultLocation =
        typeof cardConfig.defaultLocation === 'string' ? cardConfig.defaultLocation.trim() : '';
      const requestedLocation =
        typeof args.location === 'string' && args.location.trim().length > 0
          ? args.location.trim()
          : configuredDefaultLocation;

      if (!requestedLocation) {
        return {
          type: 'error',
          message: isEnglish
            ? 'Please provide a location (for example: /weather Bogotá).'
            : 'Indica una ubicación (por ejemplo: /clima Bogotá).',
        };
      }

      const configuredUnits = parseUnits(cardConfig.units);
      const requestedUnits = parseUnits(args.units);
      const resolvedUnits = requestedUnits ?? configuredUnits ?? 'metric';
      const resolvedLocale =
        typeof cardConfig.lang === 'string'
          ? cardConfig.lang.toLowerCase().startsWith('en')
            ? 'en'
            : 'es'
          : isEnglish
            ? 'en'
            : 'es';

      try {
        const forecast = await getWeatherForecast({
          location: requestedLocation,
          date: args.date,
          units: resolvedUnits,
          locale: resolvedLocale,
          forecastDays: parseForecastDays(cardConfig.forecastDays),
          signal: abortSignal,
        });

        return {
          type: 'weather_forecast',
          ...forecast,
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
          message: isEnglish
            ? `Error retrieving weather forecast: ${errorMessage}`
            : `Error al consultar el pronóstico del clima: ${errorMessage}`,
        };
      }
    },
  };
}

export const chat: FlowPackChatModule = {
  async resolveRuntime({ requestContext }) {
    const lower = requestContext.normalizedLastUserMessage.toLowerCase();
    const shouldScopeWeatherTools = WEATHER_SCOPE_KEYWORDS.some((keyword) => lower.includes(keyword));

    if (!shouldScopeWeatherTools) {
      return null;
    }

    return {
      allowedToolIds: ['show_weather_forecast'],
    };
  },
};

export const tools: FlowPackServerModule['tools'] = {
  show_weather_forecast,
};
