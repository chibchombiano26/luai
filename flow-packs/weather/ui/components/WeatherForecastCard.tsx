'use client';

import { motion } from 'framer-motion';
import {
  Sun,
  Cloud,
  CloudSun,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  MapPin,
  Sunrise,
  Sunset,
} from 'lucide-react';
import { AppLocale } from '@/lib/i18n';

interface WeatherForecastCardProps {
  locationName: string;
  timezone: string;
  units: 'metric' | 'imperial';
  summary: string;
  current: {
    time: string;
    weatherCode: number;
    weatherLabel: string;
    temperature: number;
    apparentTemperature: number;
    windSpeed: number;
  };
  daily: Array<{
    date: string;
    weatherCode: number;
    weatherLabel: string;
    tempMax: number;
    tempMin: number;
    precipitationProbabilityMax?: number;
    sunrise?: string;
    sunset?: string;
    selected?: boolean;
  }>;
  locale?: AppLocale;
}

const COPY: Record<AppLocale, { current: string; feelsLike: string; wind: string; chanceRain: string }> = {
  es: {
    current: 'Ahora',
    feelsLike: 'Sensación',
    wind: 'Viento',
    chanceRain: 'Prob. lluvia',
  },
  en: {
    current: 'Now',
    feelsLike: 'Feels like',
    wind: 'Wind',
    chanceRain: 'Rain chance',
  },
};

function WeatherIcon({ code, className }: { code: number; className?: string }) {
  if (code === 0) return <Sun className={className} />;
  if (code === 1 || code === 2) return <CloudSun className={className} />;
  if (code === 3) return <Cloud className={className} />;
  if (code === 45 || code === 48) return <CloudFog className={className} />;
  if (code === 51 || code === 53 || code === 55 || code === 56 || code === 57) {
    return <CloudDrizzle className={className} />;
  }
  if (
    code === 61 ||
    code === 63 ||
    code === 65 ||
    code === 66 ||
    code === 67 ||
    code === 80 ||
    code === 81 ||
    code === 82
  ) {
    return <CloudRain className={className} />;
  }
  if (code === 71 || code === 73 || code === 75 || code === 77 || code === 85 || code === 86) {
    return <CloudSnow className={className} />;
  }
  if (code === 95 || code === 96 || code === 99) return <CloudLightning className={className} />;
  return <Cloud className={className} />;
}

function formatDay(date: string, locale: AppLocale): string {
  const localeTag = locale === 'en' ? 'en-US' : 'es-CO';
  return new Intl.DateTimeFormat(localeTag, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T00:00:00`));
}

function formatClock(value: string | undefined, locale: AppLocale, timezone: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const localeTag = locale === 'en' ? 'en-US' : 'es-CO';
  return new Intl.DateTimeFormat(localeTag, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  }).format(parsed);
}

export function WeatherForecastCard({
  locationName,
  timezone,
  units,
  summary,
  current,
  daily,
  locale = 'es',
}: WeatherForecastCardProps) {
  const t = COPY[locale];
  const unitSymbol = units === 'imperial' ? 'F' : 'C';
  const windUnit = units === 'imperial' ? 'mph' : 'km/h';
  const selectedDay = daily.find((day) => day.selected) ?? daily[0];
  const sunrise = formatClock(selectedDay?.sunrise, locale, timezone);
  const sunset = formatClock(selectedDay?.sunset, locale, timezone);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-sky-200/80 dark:border-sky-900/40 bg-gradient-to-br from-sky-100 via-cyan-50 to-blue-100 dark:from-sky-950/40 dark:via-zinc-900 dark:to-blue-950/30 p-5 space-y-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
            {t.current}
          </p>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            {locationName}
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">{timezone}</p>
        </div>
        <div className="rounded-xl bg-white/80 dark:bg-zinc-900/60 border border-sky-200/80 dark:border-sky-900/40 px-3 py-2 flex items-center gap-2">
          <WeatherIcon code={current.weatherCode} className="w-5 h-5 text-sky-600 dark:text-sky-300" />
          <div className="text-right">
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {Math.round(current.temperature)}°{unitSymbol}
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">{current.weatherLabel}</p>
          </div>
        </div>
      </div>

      <p className="text-sm text-zinc-700 dark:text-zinc-300">{summary}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl bg-white/80 dark:bg-zinc-900/60 border border-sky-200/70 dark:border-sky-900/40 p-3 flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-orange-500" />
          <div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">{t.feelsLike}</p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {Math.round(current.apparentTemperature)}°{unitSymbol}
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-white/80 dark:bg-zinc-900/60 border border-sky-200/70 dark:border-sky-900/40 p-3 flex items-center gap-2">
          <Wind className="w-4 h-4 text-cyan-600 dark:text-cyan-300" />
          <div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">{t.wind}</p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {Math.round(current.windSpeed)} {windUnit}
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-white/80 dark:bg-zinc-900/60 border border-sky-200/70 dark:border-sky-900/40 p-3 flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-600 dark:text-blue-300" />
          <div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">{t.chanceRain}</p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {typeof selectedDay?.precipitationProbabilityMax === 'number'
                ? `${Math.round(selectedDay.precipitationProbabilityMax)}%`
                : '--'}
            </p>
          </div>
        </div>
      </div>

      {(sunrise || sunset) && (
        <div className="flex flex-wrap gap-3 text-xs text-zinc-700 dark:text-zinc-300">
          {sunrise && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/80 dark:border-amber-900/50 px-2 py-1 bg-amber-50/80 dark:bg-amber-950/20">
              <Sunrise className="w-3.5 h-3.5 text-amber-600 dark:text-amber-300" />
              {sunrise}
            </span>
          )}
          {sunset && (
            <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200/80 dark:border-indigo-900/50 px-2 py-1 bg-indigo-50/80 dark:bg-indigo-950/20">
              <Sunset className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-300" />
              {sunset}
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {daily.map((day, index) => {
          return (
            <motion.div
              key={`${day.date}-${index}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-xl border p-3 ${
                day.selected
                  ? 'bg-sky-600 text-white border-sky-700'
                  : 'bg-white/80 dark:bg-zinc-900/60 border-sky-200/70 dark:border-sky-900/40'
              }`}
            >
              <p
                className={`text-[11px] font-semibold uppercase tracking-wide ${
                  day.selected ? 'text-sky-100' : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                {formatDay(day.date, locale)}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <WeatherIcon
                  code={day.weatherCode}
                  className={`w-4 h-4 ${day.selected ? 'text-white' : 'text-sky-600 dark:text-sky-300'}`}
                />
                <span className={`text-xs ${day.selected ? 'text-sky-100' : 'text-zinc-600 dark:text-zinc-400'}`}>
                  {typeof day.precipitationProbabilityMax === 'number'
                    ? `${Math.round(day.precipitationProbabilityMax)}%`
                    : '--'}
                </span>
              </div>
              <p className={`mt-2 text-xs ${day.selected ? 'text-sky-100' : 'text-zinc-600 dark:text-zinc-400'}`}>
                {day.weatherLabel}
              </p>
              <p className={`text-sm font-semibold ${day.selected ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>
                {Math.round(day.tempMax)}° / {Math.round(day.tempMin)}°
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
