import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/platform/generated-flow-pack-ui', () => ({
  GENERATED_FLOW_PACK_UI_MODULES: {
    demo: {
      profileWidgets: [
        {
          id: 'demo-profile-widget',
          titleByLocale: {
            es: 'Widget demo',
            en: 'Demo widget',
          },
          Component: ({
            locale,
            usage,
          }: {
            locale: 'es' | 'en';
            usage: { totalTokens: number };
          }) => <div>{`widget-${locale}-${usage.totalTokens}`}</div>,
        },
      ],
    },
  },
}));

import ProfilePage from './page';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('shows loading state while fetching profile', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise(() => {
            // Keep pending for loading state assertion.
          })
      )
    );

    render(<ProfilePage />);

    expect(screen.getByText(/cargando perfil/i)).toBeInTheDocument();
  });

  it('renders token usage summary from API response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          profile: {
            username: 'jose',
            displayName: 'jose',
          },
          uiSettings: {
            showUsageSummary: true,
            showDailyUsageChart: true,
            showRecentTokenEvents: true,
          },
          usage: {
            username: 'jose',
            totalRequests: 3,
            totalQuotes: 2,
            totalInputTokens: 120,
            totalOutputTokens: 240,
            totalTokens: 360,
            last30DaysTokens: 360,
            last30DaysRequests: 3,
            dailyUsage: [
              { day: '2026-02-25', totalTokens: 200, requests: 2 },
              { day: '2026-02-24', totalTokens: 160, requests: 1 },
            ],
            recentEvents: [
              {
                id: 'usage_1',
                createdAt: '2026-02-25 12:00:00',
                model: 'gemini-flash-latest',
                locale: 'es',
                sessionId: 'chat_1',
                inputTokens: 50,
                outputTokens: 80,
                totalTokens: 130,
              },
            ],
          },
        }),
      })
    );

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /perfil/i })).toBeInTheDocument();
      expect(screen.getByText('jose')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /usuario/i })).toHaveAttribute('href', '#profile-user');
      expect(screen.getByRole('link', { name: /widget demo/i })).toHaveAttribute(
        'href',
        '#profile-widget-demo-profile-widget'
      );
      expect(screen.getByText(/tokens totales/i)).toBeInTheDocument();
      expect(screen.getByText(/tokens de entrada/i)).toBeInTheDocument();
      expect(screen.getByText(/tokens de salida/i)).toBeInTheDocument();
      expect(screen.getByText(/tokens \(30 dias\)/i)).toBeInTheDocument();
      expect(screen.getAllByText('360').length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('120')).toBeInTheDocument();
      expect(screen.getByText('240')).toBeInTheDocument();
      expect(screen.getByText('130')).toBeInTheDocument();
      expect(screen.getByText('widget-es-360')).toBeInTheDocument();
      expect(screen.getByText(/gemini-flash-latest/i)).toBeInTheDocument();
      expect(screen.queryByText(/planes de prueba/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/cotizaciones totales/i)).not.toBeInTheDocument();
    });
  });

  it('smooth-scrolls to widget sections from the side navigation', async () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      value: scrollIntoView,
      configurable: true,
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          profile: {
            username: 'jose',
            displayName: 'jose',
          },
          uiSettings: {
            showUsageSummary: true,
            showDailyUsageChart: true,
            showRecentTokenEvents: true,
          },
          usage: {
            username: 'jose',
            totalRequests: 1,
            totalQuotes: 0,
            totalInputTokens: 10,
            totalOutputTokens: 20,
            totalTokens: 30,
            last30DaysTokens: 30,
            last30DaysRequests: 1,
            dailyUsage: [],
            recentEvents: [],
          },
        }),
      })
    );

    render(<ProfilePage />);

    await screen.findByText('widget-es-30');
    const widgetLink = await screen.findByRole('link', { name: /widget demo/i });
    fireEvent.click(widgetLink);

    const widgetSection = document.getElementById('profile-widget-demo-profile-widget');
    expect(widgetSection).not.toBeNull();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
  });

  it('paginates recent events in batches of five and exports them', async () => {
    const createObjectURL = vi.fn(() => 'blob:profile-events');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL,
    } as unknown as typeof URL);

    const clickSpy = vi.fn();
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = document.createElementNS('http://www.w3.org/1999/xhtml', tagName);
      if (tagName === 'a') {
        Object.defineProperty(element, 'click', {
          value: clickSpy,
          configurable: true,
        });
      }
      return element as HTMLElement;
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          profile: {
            username: 'jose',
            displayName: 'jose',
          },
          uiSettings: {
            showUsageSummary: true,
            showDailyUsageChart: true,
            showRecentTokenEvents: true,
          },
          usage: {
            username: 'jose',
            totalRequests: 6,
            totalQuotes: 0,
            totalInputTokens: 600,
            totalOutputTokens: 600,
            totalTokens: 1200,
            last30DaysTokens: 1200,
            last30DaysRequests: 6,
            dailyUsage: [],
            recentEvents: Array.from({ length: 6 }, (_, index) => ({
              id: `usage_${index + 1}`,
              createdAt: `2026-03-0${Math.min(index + 1, 9)} 0${index}:00:00`,
              model: `gemini-${index + 1}`,
              locale: 'es',
              sessionId: `chat_${index + 1}`,
              inputTokens: 100 + index,
              outputTokens: 200 + index,
              totalTokens: 300 + index,
            })),
          },
        }),
      })
    );

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /exportar a excel/i })).toBeInTheDocument();
      expect(screen.getByText(/pagina 1 \/ 2/i)).toBeInTheDocument();
      expect(screen.getByText('gemini-1')).toBeInTheDocument();
      expect(screen.getByText('gemini-5')).toBeInTheDocument();
      expect(screen.queryByText('gemini-6')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }));

    await waitFor(() => {
      expect(screen.getByText(/pagina 2 \/ 2/i)).toBeInTheDocument();
      expect(screen.getByText('gemini-6')).toBeInTheDocument();
      expect(screen.queryByText('gemini-1')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /exportar a excel/i }));

    expect(createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:profile-events');
    createElementSpy.mockRestore();
  });

  it('renders english copy when locale is en', async () => {
    localStorage.setItem('luai_locale', 'en');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          profile: {
            username: 'jose',
            displayName: 'jose',
          },
          uiSettings: {
            showUsageSummary: true,
            showDailyUsageChart: true,
            showRecentTokenEvents: true,
          },
          usage: {
            username: 'jose',
            totalRequests: 3,
            totalQuotes: 2,
            totalInputTokens: 120,
            totalOutputTokens: 240,
            totalTokens: 360,
            last30DaysTokens: 360,
            last30DaysRequests: 3,
            dailyUsage: [],
            recentEvents: [],
          },
        }),
      })
    );

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /profile/i })).toBeInTheDocument();
      expect(screen.getByText(/token usage summary/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /user/i })).toHaveAttribute('href', '#profile-user');
      expect(screen.getByRole('link', { name: /demo widget/i })).toHaveAttribute(
        'href',
        '#profile-widget-demo-profile-widget'
      );
      expect(screen.getByText('widget-en-360')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back to chat/i })).toBeInTheDocument();
      expect(screen.getByText(/input tokens/i)).toBeInTheDocument();
      expect(screen.getByText(/output tokens/i)).toBeInTheDocument();
      expect(screen.queryByText(/total quotes/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/demo plans/i)).not.toBeInTheDocument();
    });
  });

  it('shows localized load error when API responds with non-OK status', async () => {
    localStorage.setItem('luai_locale', 'en');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
      })
    );

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText(/could not load profile information/i)).toBeInTheDocument();
    });
  });

  it('renders invalid event dates as raw text', async () => {
    localStorage.setItem('luai_locale', 'en');

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          profile: {
            username: 'jose',
            displayName: 'jose',
          },
          uiSettings: {
            showUsageSummary: true,
            showDailyUsageChart: true,
            showRecentTokenEvents: true,
          },
          usage: {
            username: 'jose',
            totalRequests: 1,
            totalQuotes: 1,
            totalInputTokens: 10,
            totalOutputTokens: 20,
            totalTokens: 30,
            last30DaysTokens: 30,
            last30DaysRequests: 1,
            dailyUsage: [],
            recentEvents: [
              {
                id: 'usage_invalid_date',
                createdAt: 'not-a-valid-date',
                model: 'gemini',
                locale: 'en',
                sessionId: null,
                inputTokens: 1,
                outputTokens: 2,
                totalTokens: 3,
              },
            ],
          },
        }),
      })
    );

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('not-a-valid-date')).toBeInTheDocument();
    });
  });

  it('avoids state updates when request resolves after unmount (success path)', async () => {
    const pendingResponse = deferred<{
      ok: boolean;
      json: () => Promise<unknown>;
    }>();
    const fetchMock = vi.fn().mockReturnValue(pendingResponse.promise);
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const { unmount } = render(<ProfilePage />);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    unmount();
    pendingResponse.resolve({
      ok: true,
      json: async () => ({
        profile: { username: 'jose', displayName: 'jose' },
        uiSettings: {
          showUsageSummary: true,
          showDailyUsageChart: true,
          showRecentTokenEvents: true,
        },
        usage: {
          username: 'jose',
          totalRequests: 0,
          totalQuotes: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalTokens: 0,
          last30DaysTokens: 0,
          last30DaysRequests: 0,
          dailyUsage: [],
          recentEvents: [],
        },
      }),
    });

    await Promise.resolve();
  });

  it('avoids state updates when request resolves after unmount (error path)', async () => {
    const pendingResponse = deferred<{
      ok: boolean;
      json?: () => Promise<unknown>;
    }>();
    const fetchMock = vi.fn().mockReturnValue(pendingResponse.promise);
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const { unmount } = render(<ProfilePage />);
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    unmount();
    pendingResponse.resolve({ ok: false });

    await Promise.resolve();
  });

  it('hides core profile sections based on admin visibility settings', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          profile: {
            username: 'jose',
            displayName: 'jose',
          },
          uiSettings: {
            showUsageSummary: false,
            showDailyUsageChart: false,
            showRecentTokenEvents: false,
          },
          usage: {
            username: 'jose',
            totalRequests: 3,
            totalQuotes: 2,
            totalInputTokens: 120,
            totalOutputTokens: 240,
            totalTokens: 360,
            last30DaysTokens: 360,
            last30DaysRequests: 3,
            dailyUsage: [{ day: '2026-02-25', totalTokens: 200, requests: 2 }],
            recentEvents: [
              {
                id: 'usage_1',
                createdAt: '2026-02-25 12:00:00',
                model: 'gemini-flash-latest',
                locale: 'es',
                sessionId: 'chat_1',
                inputTokens: 50,
                outputTokens: 80,
                totalTokens: 130,
              },
            ],
          },
        }),
      })
    );

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText('widget-es-360')).toBeInTheDocument();
      expect(screen.queryByText(/tokens totales/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/ultimos 14 dias/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/ultimos eventos de tokens/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /resumen de tokens/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /ultimos 14 dias/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /eventos recientes/i })).not.toBeInTheDocument();
    });
  });
});
