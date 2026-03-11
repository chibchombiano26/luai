import { describe, expect, it, vi } from 'vitest';

vi.mock('@packs/pokemon/shared/pokeapi', () => ({
  lookupPokemon: vi.fn(),
  shouldScopePokemonLookup: vi.fn((text: string) => text.includes('pokemon')),
}));

import { chat } from './index';

describe('pokemon chat runtime', () => {
  it('scopes pokemon turns to the pokemon tool', async () => {
    await expect(
      chat.resolveRuntime?.({
        requestContext: {
          normalizedLastUserMessage: 'quiero un pokemon',
        },
      } as never)
    ).resolves.toEqual({
      allowedToolIds: ['show_pokemon_lookup'],
    });
  });

  it('returns null when the turn is unrelated', async () => {
    await expect(
      chat.resolveRuntime?.({
        requestContext: {
          normalizedLastUserMessage: 'quiero el clima',
        },
      } as never)
    ).resolves.toBeNull();
  });
});
