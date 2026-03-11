import { afterEach, describe, expect, it, vi } from 'vitest';
import { lookupPokemon, shouldScopePokemonLookup } from './pokeapi';

describe('pokemon shared client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads a pokemon by name and enriches it with species data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            id: 25,
            name: 'pikachu',
            height: 4,
            weight: 60,
            cries: {
              latest: 'https://img/pikachu-cry.ogg',
              legacy: 'https://img/pikachu-legacy.ogg',
            },
            sprites: {
              front_default: 'https://img/pikachu.png',
              other: {
                'official-artwork': {
                  front_default: 'https://img/pikachu-art.png',
                },
              },
            },
            species: {
              name: 'pikachu',
              url: 'https://pokeapi.co/api/v2/pokemon-species/25/',
            },
            types: [
              {
                slot: 1,
                type: {
                  name: 'electric',
                },
              },
            ],
            abilities: [
              {
                slot: 1,
                ability: {
                  name: 'static',
                },
              },
            ],
            stats: [
              {
                base_stat: 35,
                stat: {
                  name: 'hp',
                },
              },
              {
                base_stat: 55,
                stat: {
                  name: 'attack',
                },
              },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            genera: [
              {
                genus: 'Pokemon Raton',
                language: { name: 'es' },
              },
            ],
            flavor_text_entries: [
              {
                flavor_text: 'Cuando se enfada, descarga energia.',
                language: { name: 'es' },
              },
            ],
          }),
        })
    );

    await expect(lookupPokemon('pikachu', { locale: 'es' })).resolves.toEqual(
      expect.objectContaining({
        id: 25,
        name: 'pikachu',
        displayName: 'Pikachu',
        genus: 'Pokemon Raton',
        flavorText: 'Cuando se enfada, descarga energia.',
        heightMeters: 0.4,
        weightKg: 6,
        types: ['Electric'],
        abilities: ['Static'],
        spriteUrl: 'https://img/pikachu.png',
        artworkUrl: 'https://img/pikachu-art.png',
        cryUrl: 'https://img/pikachu-cry.ogg',
      })
    );
  });

  it('returns a friendly not found error and supports explicit pokemon scoping words', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
      })
    );

    await expect(lookupPokemon(999999)).rejects.toThrow('Pokemon not found.');
    expect(shouldScopePokemonLookup('quiero info de un pokemon')).toBe(true);
    expect(shouldScopePokemonLookup('dime hola')).toBe(false);
  });

  it('survives species lookup failures and normalizes numbers in strings', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            id: 1,
            name: 'bulbasaur',
            height: 7,
            weight: 69,
            sprites: {
              front_default: null,
            },
            species: {
              name: 'bulbasaur',
              url: 'https://pokeapi.co/api/v2/pokemon-species/1/',
            },
            types: [
              { slot: 2, type: { name: 'poison' } },
              { slot: 1, type: { name: 'grass' } },
            ],
            abilities: [
              { slot: 2, ability: { name: 'chlorophyll' } },
              { slot: 1, ability: { name: 'overgrow' } },
            ],
            stats: [],
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({}),
        })
    );

    await expect(lookupPokemon('001', { locale: 'en' })).resolves.toEqual(
      expect.objectContaining({
        id: 1,
        displayName: 'Bulbasaur',
        genus: null,
        types: ['Grass', 'Poison'],
        abilities: ['Overgrow', 'Chlorophyll'],
      })
    );
  });
});
