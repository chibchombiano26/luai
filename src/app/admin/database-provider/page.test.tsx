import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminDatabaseProviderPage from './page';

function buildStatusResponse(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    status: {
      selectedProvider: 'sqlite',
      source: 'default',
      sqlite: {
        path: '/tmp/quotes.db',
      },
      turso: {
        url: 'libsql://example.turso.io',
        hasAuthToken: true,
        credentialsSource: 'admin',
      },
      postgres: {
        connectionString: 'postgres://user:secret@host:5432/app',
        hasConnectionString: true,
        credentialsSource: 'admin',
      },
      ...overrides,
    },
  };
}

describe('AdminDatabaseProviderPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    document.cookie = '';
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('loads sqlite fallback and turso metadata', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => buildStatusResponse(),
      })
    );

    render(<AdminDatabaseProviderPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /base de datos/i })).toBeInTheDocument();
      expect(screen.getByText('/tmp/quotes.db')).toBeInTheDocument();
      expect(screen.getByText(/hay un token disponible para turso/i)).toBeInTheDocument();
      expect(screen.getByText(/hay un connection string disponible para postgresql/i)).toBeInTheDocument();
    });

    expect(screen.getByTestId('turso-url-input')).toHaveValue('libsql://example.turso.io');
    expect(screen.getByTestId('turso-token-input')).toHaveValue('');
    expect(screen.getByTestId('postgres-connection-input')).toHaveValue('postgres://user:secret@host:5432/app');
  });

  it('reveals and copies the token on demand', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildStatusResponse(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            provider: 'turso',
            authToken: 'visible-token',
            source: 'admin',
          }),
        })
    );

    render(<AdminDatabaseProviderPage />);

    await waitFor(() => {
      expect(screen.getByTestId('toggle-token-visibility')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('toggle-token-visibility'));

    await waitFor(() => {
      expect(screen.getByTestId('turso-token-input')).toHaveValue('visible-token');
      expect(screen.getByTestId('copy-token')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('copy-token'));

    await waitFor(() => {
      expect(screen.getByText(/token copiado/i)).toBeInTheDocument();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('visible-token');
  });

  it('saves Turso config', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildStatusResponse({ turso: { url: '', hasAuthToken: false, credentialsSource: null } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () =>
            buildStatusResponse({
              selectedProvider: 'turso',
              source: 'admin',
              turso: {
                url: 'libsql://example.turso.io',
                hasAuthToken: true,
                credentialsSource: 'admin',
              },
            }),
        })
    );

    render(<AdminDatabaseProviderPage />);

    await waitFor(() => {
      expect(screen.getByTestId('turso-url-input')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('turso-url-input'), {
      target: { value: 'libsql://example.turso.io' },
    });
    fireEvent.change(screen.getByTestId('turso-token-input'), {
      target: { value: 'token-123' },
    });
    fireEvent.click(screen.getByTestId('save-turso'));

    await waitFor(() => {
      expect(screen.getByText(/configuración guardada/i)).toBeInTheDocument();
    });

    const postCall = vi.mocked(fetch).mock.calls[1];
    const requestInit = postCall[1] as RequestInit;
    expect(JSON.parse(requestInit.body as string)).toEqual({
      selectedProvider: 'turso',
      tursoUrl: 'libsql://example.turso.io',
      tursoAuthToken: 'token-123',
    });
  });

  it('reveals and copies the postgres connection string on demand', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildStatusResponse(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            provider: 'postgres',
            connectionString: 'postgres://revealed-user:revealed-pass@host:5432/app',
            source: 'admin',
          }),
        })
    );

    render(<AdminDatabaseProviderPage />);

    await waitFor(() => {
      expect(screen.getByTestId('toggle-postgres-visibility')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('toggle-postgres-visibility'));

    await waitFor(() => {
      expect(screen.getByTestId('postgres-connection-input')).toHaveValue(
        'postgres://revealed-user:revealed-pass@host:5432/app'
      );
      expect(screen.getByTestId('copy-postgres-connection')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('copy-postgres-connection'));

    await waitFor(() => {
      expect(screen.getByText(/token copiado/i)).toBeInTheDocument();
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'postgres://revealed-user:revealed-pass@host:5432/app'
    );
  });

  it('saves PostgreSQL config', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () =>
            buildStatusResponse({
              postgres: { connectionString: '', hasConnectionString: false, credentialsSource: null },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () =>
            buildStatusResponse({
              selectedProvider: 'postgres',
              source: 'admin',
              postgres: {
                connectionString: 'postgres://user:secret@host:5432/app',
                hasConnectionString: true,
                credentialsSource: 'admin',
              },
            }),
        })
    );

    render(<AdminDatabaseProviderPage />);

    await waitFor(() => {
      expect(screen.getByTestId('postgres-connection-input')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('postgres-connection-input'), {
      target: { value: 'postgres://user:secret@host:5432/app' },
    });
    fireEvent.click(screen.getByTestId('save-postgres'));

    await waitFor(() => {
      expect(screen.getByText(/configuración guardada/i)).toBeInTheDocument();
    });

    const postCall = vi.mocked(fetch).mock.calls[1];
    const requestInit = postCall[1] as RequestInit;
    expect(JSON.parse(requestInit.body as string)).toEqual({
      selectedProvider: 'postgres',
      postgresConnectionString: 'postgres://user:secret@host:5432/app',
    });
  });

  it('switches back to sqlite', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildStatusResponse({ selectedProvider: 'turso', source: 'admin' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildStatusResponse({ selectedProvider: 'sqlite', source: 'admin' }),
        })
    );

    render(<AdminDatabaseProviderPage />);

    await waitFor(() => {
      expect(screen.getByTestId('use-sqlite')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('use-sqlite'));

    await waitFor(() => {
      expect(screen.getByText(/configuración guardada/i)).toBeInTheDocument();
    });

    const postCall = vi.mocked(fetch).mock.calls[1];
    const requestInit = postCall[1] as RequestInit;
    expect(JSON.parse(requestInit.body as string)).toEqual({
      selectedProvider: 'sqlite',
    });
  });
});
