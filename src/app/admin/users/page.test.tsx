import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminUsersPage from './page';

function buildUsersResponse() {
  return {
    users: [
      {
        id: 'user_1',
        fullName: 'Jose Ramirez',
        primaryEmail: 'jose@example.com',
        role: 'viewer',
        createdAt: 100,
        lastSignInAt: 200,
      },
    ],
    roles: ['admin', 'operator', 'viewer'],
  };
}

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    document.cookie = '';
  });

  it('loads and renders users list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => buildUsersResponse(),
      })
    );

    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByText(/usuarios registrados/i)).toBeInTheDocument();
      expect(screen.getByText('Jose Ramirez')).toBeInTheDocument();
      expect(screen.getByText('jose@example.com')).toBeInTheDocument();
    });

    expect(screen.getByTestId('role-select-user_1')).toBeInTheDocument();
  });

  it('updates role for a user', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildUsersResponse(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })
    );

    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('role-select-user_1')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('role-select-user_1'), {
      target: { value: 'admin' },
    });

    fireEvent.click(screen.getByTestId('save-role-user_1'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(screen.getByText(/rol actualizado/i)).toBeInTheDocument();
    });

    const postCall = vi.mocked(fetch).mock.calls[1];
    const requestInit = postCall[1] as RequestInit;
    const payload = JSON.parse(requestInit.body as string) as {
      userId: string;
      role: string;
    };

    expect(payload).toEqual({
      userId: 'user_1',
      role: 'admin',
    });
  });

  it('shows empty state when backend returns no users', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: [] }),
      })
    );

    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByText(/no se encontraron usuarios/i)).toBeInTheDocument();
    });
  });

  it('shows backend load error message when users request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Users service unavailable' }),
      })
    );
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByText(/users service unavailable/i)).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('shows save error when role update fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => buildUsersResponse(),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Role update denied' }),
        })
    );
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByTestId('role-select-user_1')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('role-select-user_1'), {
      target: { value: 'admin' },
    });
    fireEvent.click(screen.getByTestId('save-role-user_1'));

    await waitFor(() => {
      expect(screen.getByText(/role update denied/i)).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('shows unassigned users without preselecting a role', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: [
            {
              id: 'user_3',
              fullName: 'No Role User',
              primaryEmail: 'norole@example.com',
              role: null,
              createdAt: 100,
              lastSignInAt: null,
            },
          ],
        }),
      })
    );

    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByText('No Role User')).toBeInTheDocument();
    });

    expect(screen.getByTestId('role-select-user_3')).toHaveValue('');
    expect(screen.getByRole('option', { name: /sin rol/i })).toBeInTheDocument();
  });

  it('switches locale to english, persists preference, and shows never fallback', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            users: [
              {
                id: 'user_2',
                fullName: '',
                primaryEmail: '',
                role: 'viewer',
                createdAt: 100,
                lastSignInAt: null,
              },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            users: [
              {
                id: 'user_2',
                fullName: '',
                primaryEmail: '',
                role: 'viewer',
                createdAt: 100,
                lastSignInAt: null,
              },
            ],
          }),
        })
    );

    render(<AdminUsersPage />);

    await waitFor(() => {
      expect(screen.getByText(/usuarios registrados/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'EN' }));

    expect(localStorage.getItem('luai_locale')).toBe('en');
    expect(document.cookie).toContain('app_locale=en');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /user administration/i })).toBeInTheDocument();
      expect(screen.getByText('Never')).toBeInTheDocument();
      expect(screen.getAllByText('user_2')).toHaveLength(2);
    });
  });
});
