import { z } from 'zod';
import type { FlowPackMcpModule } from '@/lib/platform/pack-mcp';
import { lookupPokemon } from '../shared/pokeapi';

const PokemonLookupInputSchema = z.object({
  pokemon: z.string().optional(),
  name: z.string().optional(),
  number: z.number().int().positive().optional(),
  locale: z.enum(['es', 'en']).optional(),
});

export const mcp: FlowPackMcpModule = {
  tools: [
    {
      name: 'lookup_pokemon',
      description: 'Look up Pokemon information by name or Pokedex number using PokeAPI.',
      inputSchema: {
        type: 'object',
        properties: {
          pokemon: {
            type: 'string',
            description: 'Pokemon name or mixed query, for example "pikachu" or "pokemon 25".',
          },
          name: {
            type: 'string',
            description: 'Pokemon name, for example "charizard".',
          },
          number: {
            type: 'number',
            description: 'Pokedex number, for example 25.',
          },
          locale: {
            type: 'string',
            enum: ['es', 'en'],
            description: 'Optional locale for flavor text and labels.',
          },
        },
      },
      enabledForCardIds: ['pokemon_lookup'],
      execute: async (args) => {
        const validated = PokemonLookupInputSchema.parse(args);
        const identifier =
          validated.number ??
          validated.pokemon?.trim() ??
          validated.name?.trim();

        if (!identifier) {
          throw new Error('Provide a Pokemon name or Pokedex number.');
        }

        return lookupPokemon(identifier, {
          locale: validated.locale ?? 'en',
        });
      },
    },
  ],
};
