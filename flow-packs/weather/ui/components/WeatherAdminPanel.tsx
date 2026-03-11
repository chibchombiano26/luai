'use client';

import type { AppLocale } from '@/lib/i18n';

const COPY = {
  es: {
    introTitle: 'Modulo de weather',
    introBody:
      'Este pack expone el flujo de pronostico, el comando /clima y un renderer especializado para mostrar el resumen meteorologico.',
    runtimeTitle: 'Runtime activo',
    runtimeItems: [
      'Card: weather_forecast',
      'Tool: show_weather_forecast',
      'Comando principal: /clima',
      'Salida UI: weather_forecast',
    ],
    configTitle: 'Campos de configuracion recomendados',
    configBody:
      'Configura defaults desde el admin principal usando JSON valido. Estos campos ya son soportados por el tool del pack.',
    guidelinesTitle: 'Notas operativas',
    guidelinesItems: [
      'Usa open-meteo como provider soportado.',
      'Define defaultLocation si quieres que el flujo responda sin pedir ciudad en cada turno.',
      'Ajusta units a metric o imperial segun tu audiencia.',
      'forecastDays controla cuantas jornadas devuelve la tarjeta del pronostico.',
    ],
  },
  en: {
    introTitle: 'Weather module',
    introBody:
      'This pack exposes the forecast flow, the /weather command, and a dedicated renderer for weather summaries.',
    runtimeTitle: 'Active runtime',
    runtimeItems: [
      'Card: weather_forecast',
      'Tool: show_weather_forecast',
      'Primary command: /weather',
      'UI output: weather_forecast',
    ],
    configTitle: 'Recommended configuration fields',
    configBody:
      'Set defaults from the main admin page using valid JSON. These fields are already supported by the pack tool.',
    guidelinesTitle: 'Operational notes',
    guidelinesItems: [
      'Use open-meteo as the supported provider.',
      'Set defaultLocation if you want answers without asking for a city every turn.',
      'Tune units to metric or imperial for your audience.',
      'forecastDays controls how many daily rows the forecast card returns.',
    ],
  },
} as const;

const WEATHER_CONFIG_EXAMPLE = `{
  "provider": "open-meteo",
  "units": "metric",
  "lang": "es",
  "defaultLocation": "Bogota",
  "forecastDays": 5
}`;

export function WeatherAdminPanel({ locale }: { locale: AppLocale }) {
  const t = COPY[locale];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-sky-200 bg-[linear-gradient(135deg,_rgba(240,249,255,0.96),_rgba(255,255,255,1))] p-6 dark:border-sky-900 dark:bg-[linear-gradient(135deg,_rgba(8,47,73,0.55),_rgba(9,9,11,0.96))]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-300">
          Weather
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          {t.introTitle}
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-zinc-600 dark:text-zinc-300">{t.introBody}</p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
            {t.configTitle}
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{t.configBody}</p>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-zinc-950 px-4 py-4 text-xs leading-6 text-emerald-300">
            <code>{WEATHER_CONFIG_EXAMPLE}</code>
          </pre>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
            {t.runtimeTitle}
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-zinc-200">
            {t.runtimeItems.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-zinc-200 px-4 py-3 dark:border-zinc-800"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
          {t.guidelinesTitle}
        </h3>
        <ul className="mt-4 grid gap-3 lg:grid-cols-2">
          {t.guidelinesItems.map((item) => (
            <li
              key={item}
              className="rounded-2xl border border-zinc-200 px-4 py-4 text-sm text-zinc-700 dark:border-zinc-800 dark:text-zinc-200"
            >
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
