import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PokemonLookupCard } from './PokemonLookupCard';

describe('PokemonLookupCard', () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the pokemon card data', () => {
    render(
      <PokemonLookupCard
        locale="es"
        onRemove={vi.fn()}
        onFormSubmit={vi.fn()}
        toolMessage={{
          id: 'tool-1',
          timestamp: Date.now(),
          type: 'dynamic_card',
          data: {
            cardId: 'pokemon_lookup',
            message: 'Pikachu (#25) es un Pokemon de tipo Electric.',
            pokemon: {
              id: 25,
              displayName: 'Pikachu',
              genus: 'Pokemon Raton',
              flavorText:
                'Cuando se enfada, descarga energia. Levanta su cola para vigilar los alrededores. A veces, puede ser alcanzado por un rayo en esa pose. Cuando corre por el bosque guarda electricidad en las mejillas y observa a cualquier intruso con mucha atencion.',
              heightMeters: 0.4,
              weightKg: 6,
              types: ['Electric'],
              abilities: ['Static'],
              stats: [
                {
                  name: 'hp',
                  label: 'HP',
                  value: 35,
                },
              ],
              spriteUrl: 'https://img/pikachu.png',
              artworkUrl: 'https://img/pikachu-art.png',
              cryUrl: 'https://img/pikachu-cry.ogg',
            },
          },
        } as never}
      />
    );

    expect(screen.getByText('Pikachu')).toBeInTheDocument();
    expect(screen.getAllByText('Pokemon Raton').length).toBeGreaterThan(0);
    expect(screen.getByText('Electric')).toBeInTheDocument();
    expect(screen.getByText('Static')).toBeInTheDocument();
    expect(screen.getByText('HP')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Escuchar sonido' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Descripcion' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Descripcion' }));
    expect(screen.queryByText(/Cuando se enfada/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Descripcion' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Habilidades' }));
    expect(screen.queryByText('Static')).not.toBeInTheDocument();
  });

  it('returns null for unrelated tool messages', () => {
    const { container } = render(
      <PokemonLookupCard
        locale="en"
        onRemove={vi.fn()}
        onFormSubmit={vi.fn()}
        toolMessage={{
          id: 'tool-2',
          timestamp: Date.now(),
          type: 'error',
          data: {},
        } as never}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
