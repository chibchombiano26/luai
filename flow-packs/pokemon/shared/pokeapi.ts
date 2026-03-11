import { z } from 'zod';
import { AppLocale } from '@/lib/i18n';

const POKEAPI_BASE_URL = process.env.POKEAPI_BASE_URL?.trim() || 'https://pokeapi.co/api/v2';
const DEFAULT_TIMEOUT_MS = 10_000;

const PokeApiPokemonSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1),
  height: z.number().nonnegative(),
  weight: z.number().nonnegative(),
  cries: z
    .object({
      latest: z.string().nullable().optional(),
      legacy: z.string().nullable().optional(),
    })
    .optional(),
  sprites: z.object({
    front_default: z.string().nullable().optional(),
    other: z
      .object({
        'official-artwork': z
          .object({
            front_default: z.string().nullable().optional(),
          })
          .optional(),
      })
      .optional(),
  }),
  species: z
    .object({
      name: z.string().trim().min(1).optional(),
      url: z.string().trim().min(1).optional(),
    })
    .optional(),
  types: z.array(
    z.object({
      slot: z.number().int().positive(),
      type: z.object({
        name: z.string().trim().min(1),
      }),
    })
  ),
  abilities: z.array(
    z.object({
      slot: z.number().int().positive(),
      ability: z.object({
        name: z.string().trim().min(1),
      }),
    })
  ),
  stats: z.array(
    z.object({
      base_stat: z.number().int().nonnegative(),
      stat: z.object({
        name: z.string().trim().min(1),
      }),
    })
  ),
});

const PokeApiSpeciesSchema = z.object({
  genera: z.array(
    z.object({
      genus: z.string().trim().min(1),
      language: z.object({
        name: z.string().trim().min(1),
      }),
    })
  ),
  flavor_text_entries: z.array(
    z.object({
      flavor_text: z.string().trim().min(1),
      language: z.object({
        name: z.string().trim().min(1),
      }),
    })
  ),
});

const POKEMON_SCOPE_KEYWORDS = ['pokemon', 'pokémon', 'pokedex', 'dex'];

const STAT_LABELS: Record<string, { es: string; en: string }> = {
  hp: { es: 'HP', en: 'HP' },
  attack: { es: 'Ataque', en: 'Attack' },
  defense: { es: 'Defensa', en: 'Defense' },
  'special-attack': { es: 'Ataque especial', en: 'Special attack' },
  'special-defense': { es: 'Defensa especial', en: 'Special defense' },
  speed: { es: 'Velocidad', en: 'Speed' },
};

export interface PokemonLookupStat {
  name: string;
  label: string;
  value: number;
}

export interface PokemonLookupResult {
  id: number;
  name: string;
  displayName: string;
  genus: string | null;
  flavorText: string | null;
  heightMeters: number;
  weightKg: number;
  types: string[];
  abilities: string[];
  stats: PokemonLookupStat[];
  spriteUrl: string | null;
  artworkUrl: string | null;
  cryUrl: string | null;
  summary: string;
}

function normalizePokemonIdentifier(value: string | number): string {
  if (typeof value === 'number') {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error('Pokemon number must be a positive integer.');
    }

    return String(value);
  }

  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    throw new Error('Pokemon identifier is required.');
  }

  if (/^\d+$/.test(trimmed)) {
    return String(Number(trimmed));
  }

  return trimmed.replace(/\s+/g, '-');
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error &&
      (error.name === 'AbortError' || error.name === 'CanceledError'))
  );
}

function createAbortError(): Error {
  const error = new Error('The operation was aborted.');
  error.name = 'AbortError';
  return error;
}

async function fetchJson<T>(
  path: string,
  options?: {
    signal?: AbortSignal;
    timeoutMs?: number;
  }
): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();

  options?.signal?.addEventListener('abort', onAbort, { once: true });

  try {
    const response = await fetch(`${POKEAPI_BASE_URL}${path}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (response.status === 404) {
      throw new Error('Pokemon not found.');
    }

    if (!response.ok) {
      throw new Error(`PokeAPI request failed (${response.status})`);
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

function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
}

function sanitizeFlavorText(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.replace(/[\n\f\r]+/g, ' ').replace(/\s+/g, ' ').trim();
  return normalized || null;
}

function pickLocalizedValue<T extends { language: { name: string } }>(
  values: readonly T[],
  locale: AppLocale
): T | null {
  const preferredLanguage = locale === 'es' ? 'es' : 'en';
  return (
    values.find((entry) => entry.language.name === preferredLanguage) ??
    values.find((entry) => entry.language.name === 'en') ??
    values[0] ??
    null
  );
}

function buildSummary(input: {
  locale: AppLocale;
  displayName: string;
  id: number;
  types: string[];
  genus: string | null;
}): string {
  const joinedTypes = input.types.join(', ');
  if (input.locale === 'es') {
    return `${input.displayName} (#${input.id}) es un Pokemon de tipo ${joinedTypes}${input.genus ? ` y pertenece a ${input.genus}` : ''}.`;
  }

  return `${input.displayName} (#${input.id}) is a ${joinedTypes} type Pokemon${input.genus ? ` classified as ${input.genus}` : ''}.`;
}

export function shouldScopePokemonLookup(text: string): boolean {
  const lowered = text.toLowerCase();
  return POKEMON_SCOPE_KEYWORDS.some((keyword) => lowered.includes(keyword));
}

export async function lookupPokemon(
  identifier: string | number,
  options?: {
    locale?: AppLocale;
    signal?: AbortSignal;
  }
): Promise<PokemonLookupResult> {
  const locale = options?.locale ?? 'en';
  const normalizedIdentifier = normalizePokemonIdentifier(identifier);
  const pokemonRaw = await fetchJson<unknown>(`/pokemon/${encodeURIComponent(normalizedIdentifier)}`, {
    signal: options?.signal,
  });
  const pokemon = PokeApiPokemonSchema.parse(pokemonRaw);

  const species = pokemon.species?.url
    ? await fetchJson<unknown>(pokemon.species.url.replace(/^https?:\/\/pokeapi\.co\/api\/v2/, ''), {
        signal: options?.signal,
      })
        .then((payload) => PokeApiSpeciesSchema.parse(payload))
        .catch(() => null)
    : null;

  const displayName = titleCase(pokemon.name);
  const localizedGenus = species
    ? pickLocalizedValue(species.genera, locale)?.genus ?? null
    : null;
  const flavorText = species
    ? sanitizeFlavorText(pickLocalizedValue(species.flavor_text_entries, locale)?.flavor_text)
    : null;
  const types = pokemon.types
    .slice()
    .sort((a, b) => a.slot - b.slot)
    .map((entry) => titleCase(entry.type.name));
  const abilities = pokemon.abilities
    .slice()
    .sort((a, b) => a.slot - b.slot)
    .map((entry) => titleCase(entry.ability.name));
  const stats = pokemon.stats.map((entry) => ({
    name: entry.stat.name,
    label: STAT_LABELS[entry.stat.name]?.[locale] ?? titleCase(entry.stat.name),
    value: entry.base_stat,
  }));
  const artworkUrl = pokemon.sprites.other?.['official-artwork']?.front_default ?? null;
  const spriteUrl = pokemon.sprites.front_default ?? null;
  const cryUrl = pokemon.cries?.latest ?? pokemon.cries?.legacy ?? null;

  return {
    id: pokemon.id,
    name: pokemon.name,
    displayName,
    genus: localizedGenus,
    flavorText,
    heightMeters: pokemon.height / 10,
    weightKg: pokemon.weight / 10,
    types,
    abilities,
    stats,
    spriteUrl,
    artworkUrl,
    cryUrl,
    summary: buildSummary({
      locale,
      displayName,
      id: pokemon.id,
      types,
      genus: localizedGenus,
    }),
  };
}
