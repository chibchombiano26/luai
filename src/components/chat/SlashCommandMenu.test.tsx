import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SlashCommandMenu } from './SlashCommandMenu';
import { MENU_COMMAND_IDS, type ChatCommandId } from '@/lib/chat/commands';

const ACTIVE_COMMAND_IDS: ChatCommandId[] = [
  'weather_forecast',
];

describe('SlashCommandMenu', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders nothing when input does not start with /', () => {
    const { container } = render(
      <SlashCommandMenu
        input="hello world"
        onSelectCommand={vi.fn()}
        locale="es"
        enabledCommandIds={ACTIVE_COMMAND_IDS}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders menu when input starts with /', () => {
    render(
      <SlashCommandMenu
        input="/"
        onSelectCommand={vi.fn()}
        locale="es"
        enabledCommandIds={ACTIVE_COMMAND_IDS}
      />
    );
    expect(screen.getByText('Comandos disponibles')).toBeInTheDocument();
  });

  it('filters commands based on search query', () => {
    render(
      <SlashCommandMenu
        input="/clim"
        onSelectCommand={vi.fn()}
        locale="es"
        enabledCommandIds={ACTIVE_COMMAND_IDS}
      />
    );
    expect(screen.getByText('Pronóstico del Clima')).toBeInTheDocument();
  });

  it('calls onSelectCommand when a command is clicked', () => {
    const mockHandler = vi.fn();
    render(
      <SlashCommandMenu
        input="/"
        onSelectCommand={mockHandler}
        locale="es"
        enabledCommandIds={ACTIVE_COMMAND_IDS}
      />
    );

    const commandButtons = screen.getAllByRole('button');
    fireEvent.click(commandButtons[0]);

    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler.mock.calls[0][0].id).toBe('weather_forecast');
  });

  it('supports keyboard navigation with arrow keys', () => {
    const { container } = render(
      <SlashCommandMenu
        input="/"
        onSelectCommand={vi.fn()}
        locale="es"
        enabledCommandIds={ACTIVE_COMMAND_IDS}
      />
    );

    const menu = container.querySelector('div');
    expect(menu).toBeInTheDocument();

    if (menu) {
      fireEvent.keyDown(menu, { key: 'ArrowDown' });
      fireEvent.keyDown(menu, { key: 'ArrowUp' });
      fireEvent.keyDown(menu, { key: 'Tab' });
    }
  });

  it('selects highlighted command with Enter and closes with Escape', () => {
    const mockHandler = vi.fn();
    const { container } = render(
      <SlashCommandMenu
        input="/"
        onSelectCommand={mockHandler}
        locale="es"
        enabledCommandIds={ACTIVE_COMMAND_IDS}
      />
    );

    const menu = container.firstElementChild as HTMLElement;
    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(screen.queryByText('Comandos disponibles')).not.toBeInTheDocument();

    const secondRender = render(
      <SlashCommandMenu
        input="/"
        onSelectCommand={mockHandler}
        locale="es"
        enabledCommandIds={ACTIVE_COMMAND_IDS}
      />
    );
    const reopenedMenu = secondRender.container.firstElementChild as HTMLElement;
    fireEvent.keyDown(reopenedMenu, { key: 'Enter' });

    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler.mock.calls[0][0].id).toBe('weather_forecast');
  });

  it('updates selected item on mouse enter and uses Enter to select it', () => {
    const mockHandler = vi.fn();
    const { container } = render(
      <SlashCommandMenu
        input="/"
        onSelectCommand={mockHandler}
        locale="es"
        enabledCommandIds={ACTIVE_COMMAND_IDS}
      />
    );

    const menu = container.firstElementChild as HTMLElement;
    const commandButtons = screen.getAllByRole('button');
    fireEvent.mouseEnter(commandButtons[0]);
    fireEvent.keyDown(menu, { key: 'Enter' });

    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(mockHandler.mock.calls[0][0].id).toBe('weather_forecast');
  });

  it('renders with English locale', () => {
    const { container } = render(
      <SlashCommandMenu
        input="/"
        onSelectCommand={vi.fn()}
        locale="en"
        enabledCommandIds={ACTIVE_COMMAND_IDS}
      />
    );
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('displays correct number of commands in Spanish', () => {
    render(
      <SlashCommandMenu
        input="/"
        onSelectCommand={vi.fn()}
        locale="es"
        enabledCommandIds={ACTIVE_COMMAND_IDS}
      />
    );
    const commandItems = screen.getAllByRole('button');
    expect(commandItems.length).toBe(1);
  });

  it('shows search results message when filtering', () => {
    render(
      <SlashCommandMenu
        input="/wea"
        onSelectCommand={vi.fn()}
        locale="en"
        enabledCommandIds={ACTIVE_COMMAND_IDS}
      />
    );
    expect(screen.getByText('Results for "wea"')).toBeInTheDocument();
  });

  it('returns null when no commands match search', () => {
    const { container } = render(
      <SlashCommandMenu
        input="/nonexistent"
        onSelectCommand={vi.fn()}
        locale="es"
        enabledCommandIds={ACTIVE_COMMAND_IDS}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows only the commands mapped from active cards', () => {
    render(
      <SlashCommandMenu
        input="/"
        onSelectCommand={vi.fn()}
        locale="es"
        enabledCommandIds={['weather_forecast']}
      />
    );
    expect(screen.getByText('Pronóstico del Clima')).toBeInTheDocument();
  });

  it('hides the menu when no commands are active', () => {
    const { container } = render(
      <SlashCommandMenu
        input="/"
        onSelectCommand={vi.fn()}
        locale="es"
        enabledCommandIds={[]}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('loads enabled commands from /api/platform/cards when ids are not provided', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          cards: [
            { id: 'weather_forecast', enabled: true, config: {} },
            { id: 'custom_card', enabled: true, config: {} },
          ],
        }),
      })
    );

    render(
      <SlashCommandMenu
        input="/"
        onSelectCommand={vi.fn()}
        locale="es"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Pronóstico del Clima')).toBeInTheDocument();
    });
  });

  it('falls back to the full command list when cards endpoint fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
      })
    );

    render(
      <SlashCommandMenu
        input="/"
        onSelectCommand={vi.fn()}
        locale="en"
      />
    );

    await waitFor(() => {
      expect(screen.getAllByRole('button')).toHaveLength(MENU_COMMAND_IDS.length);
    });
  });

  it('ignores malformed cards from the cards endpoint and supports searching by example text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          cards: [
            null,
            { id: 123, enabled: true, config: {} },
            { id: 'weather_forecast', enabled: true, config: [] },
            { id: 'custom_card', enabled: true, config: {} },
          ],
        }),
      })
    );

    const { rerender } = render(
      <SlashCommandMenu
        input="/weather"
        onSelectCommand={vi.fn()}
        locale="en"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Weather Forecast')).toBeInTheDocument();
    });

    rerender(
      <SlashCommandMenu
        input="/zzz"
        onSelectCommand={vi.fn()}
        locale="en"
        enabledCommandIds={ACTIVE_COMMAND_IDS}
      />
    );
    expect(screen.queryByText('Results for "zzz"')).not.toBeInTheDocument();
  });
});
