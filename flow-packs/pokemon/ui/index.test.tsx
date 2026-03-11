import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { adminPages, profileWidgets, renderers } from './index';

vi.mock('./components/PokemonAdminPanel', () => ({
  PokemonAdminPanel: ({ locale }: { locale: 'es' | 'en' }) => <div>{`admin-${locale}`}</div>,
}));

vi.mock('./components/PokemonProfileWidget', () => ({
  PokemonProfileWidget: ({ locale }: { locale: 'es' | 'en' }) => <div>{`profile-${locale}`}</div>,
}));

describe('pokemon ui pack', () => {
  it('registers localized title metadata', () => {
    expect(renderers).toHaveLength(1);
    expect(renderers[0].titleByLocale).toEqual({
      es: 'Pokemon',
      en: 'Pokemon',
    });
  });

  it('renders the pokemon card for pokemon_lookup messages', () => {
    const Component = renderers[0].Component;

    render(
      <Component
        toolMessage={{
          id: 'tool-1',
          timestamp: Date.now(),
          type: 'dynamic_card',
          data: {
            cardId: 'pokemon_lookup',
            message: 'Pokemon summary',
            pokemon: {
              id: 1,
              displayName: 'Bulbasaur',
              genus: null,
              flavorText: null,
              heightMeters: 0.7,
              weightKg: 6.9,
              types: ['Grass'],
              abilities: ['Overgrow'],
              stats: [],
              spriteUrl: null,
              artworkUrl: null,
              cryUrl: null,
            },
          },
        } as never}
        locale="en"
        onRemove={vi.fn()}
        onFormSubmit={vi.fn()}
      />
    );

    expect(screen.getByText('Bulbasaur')).toBeInTheDocument();
    expect(screen.getByText('Pokemon summary')).toBeInTheDocument();
  });

  it('returns null for non-pokemon tool messages', () => {
    const Component = renderers[0].Component;
    const { container } = render(
      <Component
        toolMessage={{
          id: 'tool-2',
          timestamp: Date.now(),
          type: 'error',
          data: {},
        } as never}
        locale="es"
        onRemove={vi.fn()}
        onFormSubmit={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('registers pokemon admin and profile extensions', () => {
    const AdminPage = adminPages[0].Component;
    const ProfileWidget = profileWidgets[0].Component;

    expect(adminPages[0]).toMatchObject({
      id: 'pokemon-admin',
      slug: 'pokemon',
      order: 50,
    });
    expect(profileWidgets[0]).toMatchObject({
      id: 'pokemon-preferences',
      order: 40,
    });

    render(<AdminPage locale="en" />);
    render(<ProfileWidget locale="es" profile={{} as never} usage={{} as never} />);

    expect(screen.getByText('admin-en')).toBeInTheDocument();
    expect(screen.getByText('profile-es')).toBeInTheDocument();
  });
});
