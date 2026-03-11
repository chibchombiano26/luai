'use client';

import { useEffect, useState } from 'react';
import type { AppLocale } from '@/lib/i18n';

type WeatherProfilePreferences = {
  defaultLocation: string;
  units: 'metric' | 'imperial';
  savedLocations: string[];
};

const STORAGE_KEY = 'luai.weather.profile-preferences';

const DEFAULT_PREFERENCES: WeatherProfilePreferences = {
  defaultLocation: 'Bogota',
  units: 'metric',
  savedLocations: ['Bogota', 'Medellin', 'Madrid'],
};

const COPY = {
  es: {
    title: 'Preferencias de clima',
    subtitle: 'Guarda ubicaciones frecuentes para reutilizarlas rapido en tus comandos.',
    defaultLocation: 'Ubicacion por defecto',
    units: 'Sistema de unidades',
    metric: 'Metricas',
    imperial: 'Imperiales',
    savedLocations: 'Ubicaciones guardadas',
    savedLocationsHint: 'Una ubicacion por linea. Se usaran para generar accesos rapidos.',
    save: 'Guardar preferencias',
    saving: 'Guardando...',
    success: 'Preferencias guardadas localmente.',
    quickCommands: 'Comandos sugeridos',
  },
  en: {
    title: 'Weather preferences',
    subtitle: 'Save frequent locations so you can reuse them quickly in weather commands.',
    defaultLocation: 'Default location',
    units: 'Unit system',
    metric: 'Metric',
    imperial: 'Imperial',
    savedLocations: 'Saved locations',
    savedLocationsHint: 'One location per line. These will be used to generate quick commands.',
    save: 'Save preferences',
    saving: 'Saving...',
    success: 'Preferences saved locally.',
    quickCommands: 'Suggested commands',
  },
} as const;

function parseSavedLocations(value: string): string[] {
  return value
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry, index, list) => list.indexOf(entry) === index)
    .slice(0, 6);
}

export function WeatherProfileWidget({ locale }: { locale: AppLocale }) {
  const t = COPY[locale];
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [savedLocationsInput, setSavedLocationsInput] = useState(
    DEFAULT_PREFERENCES.savedLocations.join('\n')
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setIsHydrated(true);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<WeatherProfilePreferences>;
      const nextPreferences: WeatherProfilePreferences = {
        defaultLocation:
          typeof parsed.defaultLocation === 'string' && parsed.defaultLocation.trim().length > 0
            ? parsed.defaultLocation.trim()
            : DEFAULT_PREFERENCES.defaultLocation,
        units: parsed.units === 'imperial' ? 'imperial' : 'metric',
        savedLocations: Array.isArray(parsed.savedLocations)
          ? parsed.savedLocations.map((entry) => String(entry).trim()).filter(Boolean).slice(0, 6)
          : DEFAULT_PREFERENCES.savedLocations,
      };

      setPreferences(nextPreferences);
      setSavedLocationsInput(nextPreferences.savedLocations.join('\n'));
    } catch {
      setPreferences(DEFAULT_PREFERENCES);
      setSavedLocationsInput(DEFAULT_PREFERENCES.savedLocations.join('\n'));
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const quickCommands = [
    preferences.defaultLocation,
    ...preferences.savedLocations.filter((entry) => entry !== preferences.defaultLocation),
  ].slice(0, 4);

  const handleSave = async () => {
    setIsSaving(true);
    const nextPreferences: WeatherProfilePreferences = {
      defaultLocation: preferences.defaultLocation.trim() || DEFAULT_PREFERENCES.defaultLocation,
      units: preferences.units,
      savedLocations: parseSavedLocations(savedLocationsInput),
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPreferences));
    setPreferences(nextPreferences);
    setSavedLocationsInput(nextPreferences.savedLocations.join('\n'));
    setSuccess(t.success);
    setIsSaving(false);
  };

  if (!isHydrated) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        ...
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">{t.title}</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{t.subtitle}</p>
        </div>
      </div>

      {success ? (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
          {success}
        </div>
      ) : null}

      <div className="mt-5 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-5">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {t.defaultLocation}
            <input
              type="text"
              value={preferences.defaultLocation}
              onChange={(event) => {
                setPreferences((current) => ({
                  ...current,
                  defaultLocation: event.target.value,
                }));
                setSuccess(null);
              }}
              className="mt-3 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-sky-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>

          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {t.units}
            <select
              value={preferences.units}
              onChange={(event) => {
                setPreferences((current) => ({
                  ...current,
                  units: event.target.value === 'imperial' ? 'imperial' : 'metric',
                }));
                setSuccess(null);
              }}
              className="mt-3 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-sky-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="metric">{t.metric}</option>
              <option value="imperial">{t.imperial}</option>
            </select>
          </label>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? t.saving : t.save}
          </button>
        </div>

        <div className="space-y-5">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {t.savedLocations}
            <textarea
              rows={6}
              value={savedLocationsInput}
              onChange={(event) => {
                setSavedLocationsInput(event.target.value);
                setSuccess(null);
              }}
              className="mt-3 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-sky-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.savedLocationsHint}</p>

          <div>
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              {t.quickCommands}
            </h3>
            <div className="mt-3 grid gap-3">
              {quickCommands.map((location) => (
                <code
                  key={location}
                  className="block rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                >
                  {locale === 'en'
                    ? `/weather ${location} (${preferences.units})`
                    : `/clima ${location} (${preferences.units})`}
                </code>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
