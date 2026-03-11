import { beforeEach, describe, expect, it, vi } from 'vitest';
import { show_pokemon_lookup } from './index';
import { lookupPokemon } from '@packs/pokemon/shared/pokeapi';

vi.mock('@packs/pokemon/shared/pokeapi', () => ({
  lookupPokemon: vi.fn(),
  shouldScopePokemonLookup: vi.fn(),
}));

describe('show_pokemon_lookup tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a localized dynamic card for a pokemon', async () => {
    vi.mocked(lookupPokemon).mockResolvedValueOnce({
      id: 25,
      name: 'pikachu',
      displayName: 'Pikachu',
      genus: 'Pokemon Raton',
      flavorText: 'Descripcion',
      heightMeters: 0.4,
      weightKg: 6,
      types: ['Electric'],
      abilities: ['Static'],
      stats: [],
      spriteUrl: 'https://img/pikachu.png',
      artworkUrl: 'https://img/pikachu-art.png',
      cryUrl: 'https://img/pikachu-cry.ogg',
      summary: 'Pikachu (#25) es un Pokemon de tipo Electric.',
    });

    const tool = show_pokemon_lookup({
      isEnglish: false,
      detectedPlate: null,
      cardConfigById: {
        pokemon_lookup: {},
      },
    });

    const result = await tool.execute({ pokemon: 'pikachu' });

    expect(lookupPokemon).toHaveBeenCalledWith('pikachu', {
      locale: 'es',
      signal: undefined,
    });
    expect(result).toMatchObject({
      type: 'dynamic_card',
      cardId: 'pokemon_lookup',
      title: 'Pokemon',
    });
  });

  it('returns validation and not-found errors', async () => {
    const tool = show_pokemon_lookup({
      isEnglish: true,
      detectedPlate: null,
      cardConfigById: {
        pokemon_lookup: {
          defaultPokemon: 'pikachu',
        },
      },
    });

    await expect(tool.execute({})).resolves.toEqual({
      type: 'error',
      message: 'Please provide a Pokemon name or Pokedex number.',
    });

    vi.mocked(lookupPokemon).mockRejectedValueOnce(new Error('Pokemon not found.'));
    await expect(tool.execute({ pokemon: 'missingno' })).resolves.toEqual({
      type: 'error',
      message: 'Pokemon not found. Try a valid name like pikachu or a Pokedex number like 25.',
    });
  });

  it('rethrows abort errors from provider calls', async () => {
    const abortError = new Error('The operation was aborted.');
    abortError.name = 'AbortError';
    vi.mocked(lookupPokemon).mockRejectedValueOnce(abortError);

    const tool = show_pokemon_lookup({
      isEnglish: true,
      detectedPlate: null,
      cardConfigById: {
        pokemon_lookup: {},
      },
    });

    await expect(tool.execute({ number: 25 })).rejects.toThrow('The operation was aborted.');
  });
});
