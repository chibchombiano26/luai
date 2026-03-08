import { z } from 'zod';
import { AppLocale } from '@/lib/i18n';

export type WeatherUnits = 'metric' | 'imperial';

export interface WeatherForecastDay {
  date: string;
  weatherCode: number;
  weatherLabel: string;
  tempMax: number;
  tempMin: number;
  precipitationProbabilityMax?: number;
  sunrise?: string;
  sunset?: string;
  selected?: boolean;
}

export interface WeatherForecastResult {
  locationName: string;
  timezone: string;
  latitude: number;
  longitude: number;
  units: WeatherUnits;
  summary: string;
  current: {
    time: string;
    weatherCode: number;
    weatherLabel: string;
    temperature: number;
    apparentTemperature: number;
    windSpeed: number;
  };
  daily: WeatherForecastDay[];
}

interface GetWeatherForecastArgs {
  location: string;
  locale: AppLocale;
  units?: WeatherUnits;
  date?: string;
  forecastDays?: number;
  signal?: AbortSignal;
}

const DEFAULT_FORECAST_DAYS = 5;
const DEFAULT_TIMEOUT_MS = 10000;

const GEOCODING_RESPONSE_SCHEMA = z.object({
  results: z
    .array(
      z.object({
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        timezone: z.string().optional(),
        country: z.string().optional(),
        admin1: z.string().optional(),
      })
    )
    .optional(),
});

const FORECAST_RESPONSE_SCHEMA = z.object({
  timezone: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  current: z.object({
    time: z.string(),
    temperature_2m: z.number(),
    apparent_temperature: z.number(),
    weather_code: z.number(),
    wind_speed_10m: z.number(),
  }),
  daily: z.object({
    time: z.array(z.string()),
    weather_code: z.array(z.number()),
    temperature_2m_max: z.array(z.number()),
    temperature_2m_min: z.array(z.number()),
    precipitation_probability_max: z.array(z.number()).optional(),
    sunrise: z.array(z.string()).optional(),
    sunset: z.array(z.string()).optional(),
  }),
});

function parseWeatherUnits(value: unknown): WeatherUnits | null {
  if (value === 'metric' || value === 'imperial') {
    return value;
  }
  return null;
}

function clampForecastDays(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_FORECAST_DAYS;
  const normalized = Math.floor(parsed);
  if (normalized < 1) return 1;
  if (normalized > 7) return 7;
  return normalized;
}

function getWeatherCodeLabel(code: number, locale: AppLocale): string {
  const labels: Record<number, { es: string; en: string }> = {
    0: { es: 'Despejado', en: 'Clear sky' },
    1: { es: 'Mayormente despejado', en: 'Mainly clear' },
    2: { es: 'Parcialmente nublado', en: 'Partly cloudy' },
    3: { es: 'Nublado', en: 'Overcast' },
    45: { es: 'Niebla', en: 'Fog' },
    48: { es: 'Niebla escarchada', en: 'Depositing rime fog' },
    51: { es: 'Llovizna ligera', en: 'Light drizzle' },
    53: { es: 'Llovizna moderada', en: 'Moderate drizzle' },
    55: { es: 'Llovizna intensa', en: 'Dense drizzle' },
    56: { es: 'Llovizna helada ligera', en: 'Light freezing drizzle' },
    57: { es: 'Llovizna helada intensa', en: 'Dense freezing drizzle' },
    61: { es: 'Lluvia ligera', en: 'Slight rain' },
    63: { es: 'Lluvia moderada', en: 'Moderate rain' },
    65: { es: 'Lluvia fuerte', en: 'Heavy rain' },
    66: { es: 'Lluvia helada ligera', en: 'Light freezing rain' },
    67: { es: 'Lluvia helada fuerte', en: 'Heavy freezing rain' },
    71: { es: 'Nevada ligera', en: 'Slight snow fall' },
    73: { es: 'Nevada moderada', en: 'Moderate snow fall' },
    75: { es: 'Nevada fuerte', en: 'Heavy snow fall' },
    77: { es: 'Granizo fino', en: 'Snow grains' },
    80: { es: 'Chubascos ligeros', en: 'Slight rain showers' },
    81: { es: 'Chubascos moderados', en: 'Moderate rain showers' },
    82: { es: 'Chubascos fuertes', en: 'Violent rain showers' },
    85: { es: 'Chubascos de nieve ligeros', en: 'Slight snow showers' },
    86: { es: 'Chubascos de nieve fuertes', en: 'Heavy snow showers' },
    95: { es: 'Tormenta eléctrica', en: 'Thunderstorm' },
    96: { es: 'Tormenta con granizo ligero', en: 'Thunderstorm with slight hail' },
    99: { es: 'Tormenta con granizo fuerte', en: 'Thunderstorm with heavy hail' },
  };

  const resolved = labels[code];
  if (!resolved) {
    return locale === 'es' ? 'Condición variable' : 'Variable conditions';
  }
  return locale === 'es' ? resolved.es : resolved.en;
}

function createAbortError(): Error {
  const error = new Error('The operation was aborted.');
  error.name = 'AbortError';
  return error;
}

function isAbortError(error: unknown): boolean {
  if (error && typeof error === 'object') {
    const maybeError = error as { code?: unknown };
    if (maybeError.code === 'ERR_CANCELED') return true;
  }
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error &&
      (error.name === 'AbortError' || error.name === 'CanceledError'))
  );
}

async function fetchJson<T>(url: string, options?: { signal?: AbortSignal; timeoutMs?: number }): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const onAbort = () => controller.abort();
  options?.signal?.addEventListener('abort', onAbort, { once: true });

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Weather API request failed (${response.status})`);
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

function formatTemp(value: number): string {
  return Math.round(value).toString();
}

function normalizeDate(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(trimmed);
  return match ? match[1] : null;
}

function buildSummary(params: {
  locale: AppLocale;
  locationName: string;
  units: WeatherUnits;
  currentTemp: number;
  currentLabel: string;
  targetDay?: WeatherForecastDay;
}): string {
  const unitSymbol = params.units === 'imperial' ? 'F' : 'C';
  const targetDay = params.targetDay;

  if (!targetDay) {
    return params.locale === 'es'
      ? `Clima en ${params.locationName}: ${params.currentLabel}, ${formatTemp(params.currentTemp)}°${unitSymbol}.`
      : `Weather in ${params.locationName}: ${params.currentLabel}, ${formatTemp(params.currentTemp)}°${unitSymbol}.`;
  }

  const date = targetDay.date;
  const precipitation =
    typeof targetDay.precipitationProbabilityMax === 'number'
      ? `${Math.round(targetDay.precipitationProbabilityMax)}%`
      : params.locale === 'es'
        ? 'sin dato'
        : 'n/a';

  return params.locale === 'es'
    ? `Clima en ${params.locationName}: ahora ${params.currentLabel} (${formatTemp(params.currentTemp)}°${unitSymbol}). ${date}: mínima ${formatTemp(targetDay.tempMin)}°${unitSymbol}, máxima ${formatTemp(targetDay.tempMax)}°${unitSymbol}, precipitación ${precipitation}.`
    : `Weather in ${params.locationName}: currently ${params.currentLabel} (${formatTemp(params.currentTemp)}°${unitSymbol}). ${date}: low ${formatTemp(targetDay.tempMin)}°${unitSymbol}, high ${formatTemp(targetDay.tempMax)}°${unitSymbol}, precipitation ${precipitation}.`;
}

export async function getWeatherForecast({
  location,
  locale,
  units,
  date,
  forecastDays,
  signal,
}: GetWeatherForecastArgs): Promise<WeatherForecastResult> {
  if (!location.trim()) {
    throw new Error(locale === 'es' ? 'Debes indicar una ubicación.' : 'Location is required.');
  }

  const resolvedUnits = parseWeatherUnits(units) ?? 'metric';
  const resolvedForecastDays = clampForecastDays(forecastDays);
  const geocodingLanguage = locale === 'en' ? 'en' : 'es';

  const geocodingUrl = new URL(
    process.env.OPEN_METEO_GEOCODING_BASE_URL ?? 'https://geocoding-api.open-meteo.com/v1/search'
  );
  geocodingUrl.searchParams.set('name', location.trim());
  geocodingUrl.searchParams.set('count', '1');
  geocodingUrl.searchParams.set('language', geocodingLanguage);
  geocodingUrl.searchParams.set('format', 'json');

  const geocodingRaw = await fetchJson<unknown>(geocodingUrl.toString(), { signal });
  const geocoding = GEOCODING_RESPONSE_SCHEMA.parse(geocodingRaw);
  const firstResult = geocoding.results?.[0];

  if (!firstResult) {
    throw new Error(
      locale === 'es'
        ? `No encontré resultados para "${location}".`
        : `No matches found for "${location}".`
    );
  }

  const forecastUrl = new URL(
    process.env.OPEN_METEO_FORECAST_BASE_URL ?? 'https://api.open-meteo.com/v1/forecast'
  );
  forecastUrl.searchParams.set('latitude', String(firstResult.latitude));
  forecastUrl.searchParams.set('longitude', String(firstResult.longitude));
  forecastUrl.searchParams.set(
    'current',
    'temperature_2m,apparent_temperature,weather_code,wind_speed_10m'
  );
  forecastUrl.searchParams.set(
    'daily',
    'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset'
  );
  forecastUrl.searchParams.set('timezone', 'auto');
  forecastUrl.searchParams.set('forecast_days', String(resolvedForecastDays));
  forecastUrl.searchParams.set(
    'temperature_unit',
    resolvedUnits === 'imperial' ? 'fahrenheit' : 'celsius'
  );
  forecastUrl.searchParams.set(
    'wind_speed_unit',
    resolvedUnits === 'imperial' ? 'mph' : 'kmh'
  );

  const forecastRaw = await fetchJson<unknown>(forecastUrl.toString(), { signal });
  const forecast = FORECAST_RESPONSE_SCHEMA.parse(forecastRaw);
  const dailyRows = forecast.daily.time.map((day, index) => {
    const weatherCode = forecast.daily.weather_code[index];
    return {
      date: day,
      weatherCode,
      weatherLabel: getWeatherCodeLabel(weatherCode, locale),
      tempMax: forecast.daily.temperature_2m_max[index],
      tempMin: forecast.daily.temperature_2m_min[index],
      precipitationProbabilityMax: forecast.daily.precipitation_probability_max?.[index],
      sunrise: forecast.daily.sunrise?.[index],
      sunset: forecast.daily.sunset?.[index],
    } as WeatherForecastDay;
  });

  const normalizedTargetDate = normalizeDate(date);
  const selectedIndex = normalizedTargetDate
    ? dailyRows.findIndex((day) => day.date === normalizedTargetDate)
    : 0;
  const resolvedSelectedIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const daily = dailyRows.map((day, index) => ({
    ...day,
    selected: index === resolvedSelectedIndex,
  }));
  const selectedDay = daily[resolvedSelectedIndex];

  const locationName = [
    firstResult.name,
    firstResult.admin1,
    firstResult.country,
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(', ');

  const currentWeatherLabel = getWeatherCodeLabel(forecast.current.weather_code, locale);
  const summary = buildSummary({
    locale,
    locationName,
    units: resolvedUnits,
    currentTemp: forecast.current.temperature_2m,
    currentLabel: currentWeatherLabel,
    targetDay: selectedDay,
  });

  return {
    locationName,
    timezone: forecast.timezone,
    latitude: forecast.latitude,
    longitude: forecast.longitude,
    units: resolvedUnits,
    summary,
    current: {
      time: forecast.current.time,
      weatherCode: forecast.current.weather_code,
      weatherLabel: currentWeatherLabel,
      temperature: forecast.current.temperature_2m,
      apparentTemperature: forecast.current.apparent_temperature,
      windSpeed: forecast.current.wind_speed_10m,
    },
    daily,
  };
}
