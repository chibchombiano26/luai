import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomeClient } from './HomeClient';

const clerkState = vi.hoisted(() => ({
  isLoaded: false,
  isSignedIn: false,
}));
const themeState = vi.hoisted(() => ({
  theme: 'light' as 'light' | 'dark',
  accentTheme: 'blue' as
    | 'blue'
    | 'emerald'
    | 'rose'
    | 'amber'
    | 'violet'
    | 'cyan'
    | 'indigo'
    | 'teal',
  toggleTheme: vi.fn(),
  setAccentTheme: vi.fn(),
  mounted: true,
}));

vi.mock('@clerk/nextjs', () => ({
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useUser: () => clerkState,
}));

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => themeState,
}));

vi.mock('@/components/chat/Chat', () => ({
  Chat: ({
    clerkEnabled,
    headerAccessory,
  }: {
    clerkEnabled?: boolean;
    headerAccessory?: React.ReactNode;
  }) => (
    <div>
      <div data-testid="mock-chat">{String(Boolean(clerkEnabled))}</div>
      {headerAccessory ? <div data-testid="mock-chat-header-accessory">{headerAccessory}</div> : null}
    </div>
  ),
}));

vi.mock('@/lib/platform/generated-flow-pack-ui', () => ({
  GENERATED_FLOW_PACK_UI_MODULES: {
    bbva_cotizador: {
      homeExperiences: [
        {
          componentKey: 'bbva_classic_wizard',
          Component: ({
            chromeAccessory,
            locale,
          }: {
            chromeAccessory?: React.ReactNode;
            locale?: 'es' | 'en';
          }) => (
            <div>
              <div data-testid="mock-bbva-classic">classic</div>
              <div data-testid="mock-bbva-classic-locale">{locale ?? 'es'}</div>
              {chromeAccessory ? <div data-testid="mock-bbva-chrome">{chromeAccessory}</div> : null}
            </div>
          ),
        },
        {
          componentKey: 'bbva_classic_form',
          Component: ({
            chromeAccessory,
            locale,
          }: {
            chromeAccessory?: React.ReactNode;
            locale?: 'es' | 'en';
          }) => (
            <div>
              <div data-testid="mock-bbva-form">form</div>
              <div data-testid="mock-bbva-form-locale">{locale ?? 'es'}</div>
              {chromeAccessory ? <div data-testid="mock-bbva-chrome">{chromeAccessory}</div> : null}
            </div>
          ),
        },
      ],
    },
    insurance: {
      homeExperiences: [
        {
          componentKey: 'insurance_classic_wizard',
          Component: ({
            chromeAccessory,
            locale,
          }: {
            chromeAccessory?: React.ReactNode;
            locale?: 'es' | 'en';
          }) => (
            <div>
              <div data-testid="mock-insurance-classic">insurance-classic</div>
              <div data-testid="mock-insurance-classic-locale">{locale ?? 'es'}</div>
              {chromeAccessory ? <div data-testid="mock-insurance-chrome">{chromeAccessory}</div> : null}
            </div>
          ),
        },
        {
          componentKey: 'insurance_classic_form',
          Component: ({
            chromeAccessory,
            locale,
          }: {
            chromeAccessory?: React.ReactNode;
            locale?: 'es' | 'en';
          }) => (
            <div>
              <div data-testid="mock-insurance-form">insurance-form</div>
              <div data-testid="mock-insurance-form-locale">{locale ?? 'es'}</div>
              {chromeAccessory ? <div data-testid="mock-insurance-chrome">{chromeAccessory}</div> : null}
            </div>
          ),
        },
      ],
    },
  },
}));

describe('HomeClient', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    clerkState.isLoaded = false;
    clerkState.isSignedIn = false;
    themeState.theme = 'light';
    themeState.accentTheme = 'blue';
    themeState.mounted = true;
    themeState.toggleTheme.mockReset();
    themeState.setAccentTheme.mockReset();
    window.localStorage.clear();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        cards: [
          {
            id: 'bbva_property_quote',
            enabled: true,
            order: 10,
            homeExperiences: [
              {
                id: 'classic_wizard',
                kind: 'wizard',
                componentKey: 'bbva_classic_wizard',
                storageAliases: ['classic', 'classic-wizard'],
                order: 10,
                label: { es: 'Wizard BBVA', en: 'BBVA Wizard' },
              },
              {
                id: 'classic_form',
                kind: 'form',
                componentKey: 'bbva_classic_form',
                storageAliases: ['classic-form'],
                order: 20,
                label: { es: 'Formulario BBVA', en: 'BBVA Form' },
              },
            ],
          },
          {
            id: 'insurer_comparison',
            enabled: true,
            order: 20,
            homeExperiences: [
              {
                id: 'classic_wizard',
                kind: 'wizard',
                componentKey: 'insurance_classic_wizard',
                order: 10,
                label: { es: 'Wizard seguros', en: 'Insurance wizard' },
              },
              {
                id: 'classic_form',
                kind: 'form',
                componentKey: 'insurance_classic_form',
                order: 20,
                label: { es: 'Formulario seguros', en: 'Insurance form' },
              },
            ],
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  it('renders the chat directly when Clerk auth is disabled', () => {
    render(<HomeClient clerkEnabled={false} />);

    expect(screen.getByTestId('mock-chat')).toHaveTextContent('false');
  });

  it('renders the external toolbar when experiences are available', async () => {
    render(<HomeClient clerkEnabled={false} />);

    expect(await screen.findByTestId('mock-chat-header-accessory')).toBeInTheDocument();
    expect(screen.getByLabelText('Selector de vista')).toHaveValue('chat');
    expect(screen.queryByTestId('home-experience-toolbar-slot')).not.toBeInTheDocument();
    expect(screen.queryByTestId('home-experience-menu')).not.toBeInTheDocument();
  });

  it('switches to the BBVA classic wizard mode', async () => {
    const user = userEvent.setup();
    render(<HomeClient clerkEnabled={false} />);

    expect(screen.getByTestId('mock-chat')).toBeInTheDocument();
    await user.selectOptions(await screen.findByLabelText('Selector de vista'), 'wizard');

    expect(screen.getByTestId('mock-bbva-classic')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-chat')).not.toBeInTheDocument();
    expect(screen.getByTestId('home-experience-menu')).toBeInTheDocument();
  });

  it('switches to the BBVA classic form mode', async () => {
    const user = userEvent.setup();
    render(<HomeClient clerkEnabled={false} />);

    expect(screen.getByTestId('mock-chat')).toBeInTheDocument();
    await user.selectOptions(await screen.findByLabelText('Selector de vista'), 'form');

    expect(screen.getByTestId('mock-bbva-form')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-chat')).not.toBeInTheDocument();
  });

  it('hides the hamburger menu while chat is active', async () => {
    render(<HomeClient clerkEnabled={false} />);

    expect(await screen.findByLabelText('Selector de vista')).toHaveValue('chat');
    expect(screen.queryByTestId('home-experience-menu')).not.toBeInTheDocument();
  });

  it('lets users change theme and accent color from the hamburger menu', async () => {
    const user = userEvent.setup();
    render(<HomeClient clerkEnabled={false} />);

    await user.selectOptions(await screen.findByLabelText('Selector de vista'), 'wizard');
    await user.click(await screen.findByLabelText('Abrir menú principal'));
    await user.click(screen.getByRole('button', { name: /Tema claro/i }));

    expect(themeState.toggleTheme).toHaveBeenCalledTimes(1);

    await user.click(await screen.findByLabelText('Abrir menú principal'));
    await user.click(screen.getByTestId('accent-swatch-emerald'));

    expect(themeState.setAccentTheme).toHaveBeenCalledWith('emerald');
  });

  it('shows only wizard options in the menu when wizard family is active', async () => {
    const user = userEvent.setup();
    render(<HomeClient clerkEnabled={false} />);

    await user.selectOptions(await screen.findByLabelText('Selector de vista'), 'wizard');
    await user.click(screen.getByLabelText('Abrir menú principal'));
    expect(await screen.findByText('Wizard BBVA')).toBeInTheDocument();
    expect(screen.getByText('Wizard seguros')).toBeInTheDocument();
    expect(screen.getByText('Perfil')).toBeInTheDocument();
    expect(screen.queryByRole('menuitemradio', { name: 'Formulario BBVA' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('menuitemradio', { name: 'Wizard seguros' }));

    expect(screen.getByTestId('mock-insurance-classic')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-chat')).not.toBeInTheDocument();
  });

  it('shows only form options in the menu when form family is active', async () => {
    const user = userEvent.setup();
    render(<HomeClient clerkEnabled={false} />);

    await user.selectOptions(await screen.findByLabelText('Selector de vista'), 'form');
    await user.click(screen.getByLabelText('Abrir menú principal'));

    expect(await screen.findByText('Formulario BBVA')).toBeInTheDocument();
    expect(screen.getByText('Formulario seguros')).toBeInTheDocument();
    expect(screen.queryByRole('menuitemradio', { name: 'Wizard BBVA' })).not.toBeInTheDocument();
  });

  it('changes the active experience locale from the hamburger menu', async () => {
    const user = userEvent.setup();
    render(<HomeClient clerkEnabled={false} />);

    await user.selectOptions(await screen.findByLabelText('Selector de vista'), 'wizard');
    expect(screen.getByTestId('mock-bbva-classic-locale')).toHaveTextContent('es');

    await user.click(screen.getByLabelText('Abrir menú principal'));
    await user.click(screen.getByRole('button', { name: 'EN' }));

    await waitFor(() => {
      expect(screen.getByTestId('mock-bbva-classic-locale')).toHaveTextContent('en');
    });
  });

  it('restores the persisted BBVA mode after mount without changing the initial render', async () => {
    window.localStorage.setItem('luai_home_experience_mode', 'classic-form');

    render(<HomeClient clerkEnabled={false} />);

    expect(screen.getByTestId('mock-chat')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('mock-bbva-form')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Selector de vista')).toHaveValue('form');
  });

  it('hides the BBVA classic mode when the card is disabled', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cards: [{ id: 'bbva_property_quote', enabled: false, homeExperiences: [] }],
      }),
    });

    render(<HomeClient clerkEnabled={false} />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/platform/cards',
        expect.objectContaining({
          cache: 'no-store',
        })
      );
    });

    expect(screen.queryByTestId('home-experience-menu')).not.toBeInTheDocument();
    expect(screen.getByTestId('mock-chat')).toBeInTheDocument();
  });

  it('renders the dedicated sign-in screen when Clerk is enabled and signed out', () => {
    render(<HomeClient clerkEnabled />);

    expect(screen.getByRole('button', { name: 'Ingresar a LuAI' })).toBeInTheDocument();
    expect(screen.queryByTestId('mock-chat')).not.toBeInTheDocument();
  });

  it('switches the access screen copy between Spanish and English', async () => {
    const user = userEvent.setup();
    render(<HomeClient clerkEnabled />);

    expect(screen.getByRole('button', { name: 'Ingresar a LuAI' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByRole('button', { name: 'Sign in to LuAI' })).toBeInTheDocument();
  });

  it('renders the chat once the Clerk user is signed in', () => {
    clerkState.isLoaded = true;
    clerkState.isSignedIn = true;

    render(<HomeClient clerkEnabled />);

    expect(screen.getByTestId('mock-chat')).toHaveTextContent('true');
  });
});
