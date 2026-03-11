'use client';

import { useEffect, useState } from 'react';
import type { AppLocale } from '@/lib/i18n';

type PokemonProfilePreferences = {
  defaultPokemon: string;
  comparePokemon: string;
  favoritePokemon: string[];
  preferNumbers: boolean;
};

const STORAGE_KEY = 'luai.pokemon.profile-preferences';

const DEFAULT_PREFERENCES: PokemonProfilePreferences = {
  defaultPokemon: 'pikachu',
  comparePokemon: 'charizard',
  favoritePokemon: ['pikachu', 'bulbasaur', 'mew'],
  preferNumbers: false,
};

const COPY = {
  es: {
    title: 'Preferencias de Pokemon',
    subtitle: 'Guarda referencias rapidas para repetir consultas frecuentes.',
    defaultPokemon: 'Pokemon por defecto',
    comparePokemon: 'Pokemon para comparar',
    favorites: 'Favoritos',
    favoritesHint: 'Un Pokemon por linea. Puedes usar nombre o numero de Pokedex.',
    preferNumbers: 'Prefiero consultar por numero cuando sea posible',
    save: 'Guardar preferencias',
    saving: 'Guardando...',
    success: 'Preferencias guardadas localmente.',
    quickCommands: 'Consultas sugeridas',
  },
  en: {
    title: 'Pokemon preferences',
    subtitle: 'Save quick references so you can repeat common lookups faster.',
    defaultPokemon: 'Default Pokemon',
    comparePokemon: 'Comparison Pokemon',
    favorites: 'Favorites',
    favoritesHint: 'One Pokemon per line. You can use names or Pokedex numbers.',
    preferNumbers: 'Prefer number-based lookups when possible',
    save: 'Save preferences',
    saving: 'Saving...',
    success: 'Preferences saved locally.',
    quickCommands: 'Suggested lookups',
  },
} as const;

function parseFavorites(value: string): string[] {
  return value
    .split('\n')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .filter((entry, index, list) => list.indexOf(entry) === index)
    .slice(0, 6);
}

export function PokemonProfileWidget({ locale }: { locale: AppLocale }) {
  const t = COPY[locale];
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [favoritesInput, setFavoritesInput] = useState(
    DEFAULT_PREFERENCES.favoritePokemon.join('\n')
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

      const parsed = JSON.parse(raw) as Partial<PokemonProfilePreferences>;
      const nextPreferences: PokemonProfilePreferences = {
        defaultPokemon:
          typeof parsed.defaultPokemon === 'string' && parsed.defaultPokemon.trim().length > 0
            ? parsed.defaultPokemon.trim().toLowerCase()
            : DEFAULT_PREFERENCES.defaultPokemon,
        comparePokemon:
          typeof parsed.comparePokemon === 'string' && parsed.comparePokemon.trim().length > 0
            ? parsed.comparePokemon.trim().toLowerCase()
            : DEFAULT_PREFERENCES.comparePokemon,
        favoritePokemon: Array.isArray(parsed.favoritePokemon)
          ? parsed.favoritePokemon.map((entry) => String(entry).trim().toLowerCase()).filter(Boolean).slice(0, 6)
          : DEFAULT_PREFERENCES.favoritePokemon,
        preferNumbers: Boolean(parsed.preferNumbers),
      };

      setPreferences(nextPreferences);
      setFavoritesInput(nextPreferences.favoritePokemon.join('\n'));
    } catch {
      setPreferences(DEFAULT_PREFERENCES);
      setFavoritesInput(DEFAULT_PREFERENCES.favoritePokemon.join('\n'));
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const quickLookups = [
    preferences.defaultPokemon,
    preferences.comparePokemon,
    ...preferences.favoritePokemon.filter(
      (entry) => entry !== preferences.defaultPokemon && entry !== preferences.comparePokemon
    ),
  ].slice(0, 4);

  const handleSave = async () => {
    setIsSaving(true);
    const nextPreferences: PokemonProfilePreferences = {
      defaultPokemon: preferences.defaultPokemon.trim().toLowerCase() || DEFAULT_PREFERENCES.defaultPokemon,
      comparePokemon: preferences.comparePokemon.trim().toLowerCase() || DEFAULT_PREFERENCES.comparePokemon,
      favoritePokemon: parseFavorites(favoritesInput),
      preferNumbers: preferences.preferNumbers,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPreferences));
    setPreferences(nextPreferences);
    setFavoritesInput(nextPreferences.favoritePokemon.join('\n'));
    setSuccess(t.success);
    setIsSaving(false);
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      {!isHydrated ? (
        <div className="text-sm text-zinc-500 dark:text-zinc-400">...</div>
      ) : (
        <>
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
                {t.defaultPokemon}
                <input
                  type="text"
                  value={preferences.defaultPokemon}
                  onChange={(event) => {
                    setPreferences((current) => ({
                      ...current,
                      defaultPokemon: event.target.value,
                    }));
                    setSuccess(null);
                  }}
                  className="mt-3 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </label>

              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                {t.comparePokemon}
                <input
                  type="text"
                  value={preferences.comparePokemon}
                  onChange={(event) => {
                    setPreferences((current) => ({
                      ...current,
                      comparePokemon: event.target.value,
                    }));
                    setSuccess(null);
                  }}
                  className="mt-3 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-zinc-200 px-4 py-4 text-sm text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={preferences.preferNumbers}
                  onChange={(event) => {
                    setPreferences((current) => ({
                      ...current,
                      preferNumbers: event.target.checked,
                    }));
                    setSuccess(null);
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-amber-600"
                />
                <span>{t.preferNumbers}</span>
              </label>

              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-medium text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? t.saving : t.save}
              </button>
            </div>

            <div className="space-y-5">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                {t.favorites}
                <textarea
                  rows={6}
                  value={favoritesInput}
                  onChange={(event) => {
                    setFavoritesInput(event.target.value);
                    setSuccess(null);
                  }}
                  className="mt-3 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-amber-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </label>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.favoritesHint}</p>

              <div>
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                  {t.quickCommands}
                </h3>
                <div className="mt-3 grid gap-3">
                  {quickLookups.map((entry) => (
                    <code
                      key={entry}
                      className="block rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                    >
                      {preferences.preferNumbers && /^\d+$/.test(entry)
                        ? `/pokemon ${entry}`
                        : `/pokemon ${entry}`}
                    </code>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
