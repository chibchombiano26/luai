import { z } from 'zod';
import type { FlowPackChatModule, FlowPackServerModule } from '@/lib/platform/pack-server';
import type { ToolContext } from '@/app/api/chat/agent-tools-types';
import { lookupPokemon, shouldScopePokemonLookup } from '@packs/pokemon/shared/pokeapi';

const inputSchema = z.object({
  pokemon: z.string().optional(),
  name: z.string().optional(),
  number: z.number().int().positive().optional(),
  query: z.string().optional(),
});

function resolvePokemonIdentifier(
  args: z.infer<typeof inputSchema>,
  _cardConfig: Record<string, unknown>
): string | number | null {
  if (typeof args.number === 'number') {
    return args.number;
  }

  const fromText = args.pokemon?.trim() || args.name?.trim() || args.query?.trim();
  if (fromText) {
    return fromText;
  }

  return null;
}

function resolveLocale(context: ToolContext, cardConfig: Record<string, unknown>): 'es' | 'en' {
  if (typeof cardConfig.lang === 'string') {
    return cardConfig.lang.toLowerCase().startsWith('en') ? 'en' : 'es';
  }

  return context.isEnglish ? 'en' : 'es';
}

export function show_pokemon_lookup(context: ToolContext) {
  const cardConfig = context.cardConfigById?.pokemon_lookup ?? {};

  return {
    description: context.isEnglish
      ? 'Look up Pokemon information by name or Pokedex number using PokeAPI'
      : 'Consultar informacion de un Pokemon por nombre o numero de Pokedex usando PokeAPI',
    inputSchema,
    execute: async (args: z.infer<typeof inputSchema>) => {
      const identifier = resolvePokemonIdentifier(args, cardConfig);
      if (!identifier) {
        return {
          type: 'error',
          message: context.isEnglish
            ? 'Please provide a Pokemon name or Pokedex number.'
            : 'Indica un nombre o numero de Pokemon.',
        };
      }

      const locale = resolveLocale(context, cardConfig);

      try {
        const pokemon = await lookupPokemon(identifier, {
          locale,
          signal: context.abortSignal,
        });

        return {
          type: 'dynamic_card',
          cardId: 'pokemon_lookup',
          title: locale === 'es' ? 'Pokemon' : 'Pokemon',
          description:
            locale === 'es'
              ? 'Informacion actual consultada desde PokeAPI.'
              : 'Live Pokemon information powered by PokeAPI.',
          message: pokemon.summary,
          pokemon,
          details: [
            {
              label: locale === 'es' ? 'Pokemon' : 'Pokemon',
              value: `${pokemon.displayName} (#${pokemon.id})`,
            },
            {
              label: locale === 'es' ? 'Tipos' : 'Types',
              value: pokemon.types.join(', '),
            },
            {
              label: locale === 'es' ? 'Habilidades' : 'Abilities',
              value: pokemon.abilities.join(', '),
            },
            {
              label: locale === 'es' ? 'Altura' : 'Height',
              value: `${pokemon.heightMeters} m`,
            },
            {
              label: locale === 'es' ? 'Peso' : 'Weight',
              value: `${pokemon.weightKg} kg`,
            },
          ],
        };
      } catch (error) {
        if (
          error instanceof Error &&
          (error.name === 'AbortError' || error.name === 'CanceledError')
        ) {
          throw error;
        }

        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage === 'Pokemon not found.') {
          return {
            type: 'error',
            message: context.isEnglish
              ? 'Pokemon not found. Try a valid name like pikachu or a Pokedex number like 25.'
              : 'No encontre ese Pokemon. Prueba con un nombre valido como pikachu o un numero como 25.',
          };
        }

        return {
          type: 'error',
          message: context.isEnglish
            ? `Error retrieving Pokemon information: ${errorMessage}`
            : `Error al consultar la informacion del Pokemon: ${errorMessage}`,
        };
      }
    },
  };
}

export const chat: FlowPackChatModule = {
  async resolveRuntime({ requestContext }) {
    if (!shouldScopePokemonLookup(requestContext.normalizedLastUserMessage)) {
      return null;
    }

    return {
      allowedToolIds: ['show_pokemon_lookup'],
    };
  },
};

export const tools: FlowPackServerModule['tools'] = {
  show_pokemon_lookup,
};
