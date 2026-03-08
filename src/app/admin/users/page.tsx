'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Save } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSideNav } from '@/components/admin/AdminSideNav';
import { AppLocale, normalizeLocale } from '@/lib/i18n';
import { APP_USER_ROLES, type AppUserRole } from '@/lib/access/roles';
import { LEGACY_LOCALE_STORAGE_KEYS, LOCALE_STORAGE_KEY } from '@/components/chat/chat-constants';
import { getCompatStorageItem, setCompatStorageItem } from '@/lib/browser-storage';

interface AdminUser {
  id: string;
  fullName: string;
  primaryEmail: string;
  role: AppUserRole | null;
  createdAt: number;
  lastSignInAt: number | null;
}

type RoleSelectValue = AppUserRole | '';

const COPY: Record<
  AppLocale,
  {
    pageTitle: string;
    pageSubtitle: string;
    backToChat: string;
    usersTitle: string;
    usersHint: string;
    usersEmpty: string;
    loading: string;
    loadError: string;
    saveError: string;
    saved: string;
    reload: string;
    roleLabel: string;
    nameLabel: string;
    emailLabel: string;
    createdAtLabel: string;
    lastSignInLabel: string;
    saveRole: string;
    never: string;
    unassignedRoleLabel: string;
    roleOptionLabels: Record<AppUserRole, string>;
  }
> = {
  es: {
    pageTitle: 'Administración de Usuarios',
    pageSubtitle: 'Gestiona usuarios y roles de la aplicación',
    backToChat: 'Volver al chat',
    usersTitle: 'Usuarios registrados',
    usersHint: 'Asigna roles usando Clerk `publicMetadata.role`.',
    usersEmpty: 'No se encontraron usuarios.',
    loading: 'Cargando usuarios...',
    loadError: 'Error al cargar usuarios',
    saveError: 'Error al guardar el rol',
    saved: 'Rol actualizado ✓',
    reload: 'Recargar',
    roleLabel: 'Rol',
    nameLabel: 'Nombre',
    emailLabel: 'Email',
    createdAtLabel: 'Creado',
    lastSignInLabel: 'Último acceso',
    saveRole: 'Guardar rol',
    never: 'Nunca',
    unassignedRoleLabel: 'Sin rol',
    roleOptionLabels: {
      admin: 'Admin',
      operator: 'Operador',
      viewer: 'Visualizador',
    },
  },
  en: {
    pageTitle: 'User Administration',
    pageSubtitle: 'Manage application users and roles',
    backToChat: 'Back to chat',
    usersTitle: 'Registered users',
    usersHint: 'Assign roles using Clerk `publicMetadata.role`.',
    usersEmpty: 'No users found.',
    loading: 'Loading users...',
    loadError: 'Error loading users',
    saveError: 'Error saving role',
    saved: 'Role updated ✓',
    reload: 'Reload',
    roleLabel: 'Role',
    nameLabel: 'Name',
    emailLabel: 'Email',
    createdAtLabel: 'Created',
    lastSignInLabel: 'Last sign-in',
    saveRole: 'Save role',
    never: 'Never',
    unassignedRoleLabel: 'Unassigned',
    roleOptionLabels: {
      admin: 'Admin',
      operator: 'Operator',
      viewer: 'Viewer',
    },
  },
};

function formatDate(timestamp: number | null, locale: AppLocale, fallback: string): string {
  if (!timestamp) return fallback;

  const formatter = locale === 'es' ? 'es-CO' : 'en-US';
  return new Date(timestamp).toLocaleString(formatter, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminUsersPage() {
  const [locale, setLocale] = useState<AppLocale>('es');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roleByUserId, setRoleByUserId] = useState<Record<string, RoleSelectValue>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const t = COPY[locale];

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message =
          typeof payload.error === 'string' && payload.error.trim() ? payload.error : t.loadError;
        throw new Error(message);
      }

      const payload = await response.json();
      const receivedUsers = Array.isArray(payload.users) ? (payload.users as AdminUser[]) : [];
      setUsers(receivedUsers);
      setRoleByUserId(
        receivedUsers.reduce<Record<string, RoleSelectValue>>((acc, user) => {
          acc[user.id] = user.role ?? '';
          return acc;
        }, {})
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t.loadError);
      console.error(loadError);
    } finally {
      setIsLoading(false);
    }
  }, [t.loadError]);

  useEffect(() => {
    const storedLocale = getCompatStorageItem(
      localStorage,
      LOCALE_STORAGE_KEY,
      LEGACY_LOCALE_STORAGE_KEYS
    );
    if (storedLocale) {
      setLocale(normalizeLocale(storedLocale));
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const changeLocale = (nextLocale: AppLocale) => {
    setLocale(nextLocale);
    setCompatStorageItem(localStorage, LOCALE_STORAGE_KEY, nextLocale, LEGACY_LOCALE_STORAGE_KEYS);
    document.cookie = `app_locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
  };

  const handleRoleChange = (userId: string, role: RoleSelectValue) => {
    setRoleByUserId((previous) => ({
      ...previous,
      [userId]: role,
    }));
  };

  const handleSaveRole = async (userId: string) => {
    const nextRole = roleByUserId[userId];
    if (!nextRole) return;

    setSavingUserId(userId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          role: nextRole,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message =
          typeof payload.error === 'string' && payload.error.trim() ? payload.error : t.saveError;
        throw new Error(message);
      }

      setUsers((previous) =>
        previous.map((user) =>
          user.id === userId
            ? {
                ...user,
                role: nextRole,
              }
            : user
        )
      );
      setSuccess(t.saved);
      setTimeout(() => setSuccess(''), 3000);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t.saveError);
      console.error(saveError);
    } finally {
      setSavingUserId(null);
    }
  };

  const sortedUsers = useMemo(
    () => [...users].sort((left, right) => right.createdAt - left.createdAt),
    [users]
  );

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <AdminPageHeader
        locale={locale}
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
        backLabel={t.backToChat}
        onChangeLocale={changeLocale}
      />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside>
            <AdminSideNav locale={locale} />
          </aside>

          <div className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">⚠️ {error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-400">✓ {success}</p>
              </div>
            )}

            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{t.usersTitle}</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.usersHint}</p>
                </div>
                <button
                  onClick={loadUsers}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-3 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t.reload}
                </button>
              </div>

              {isLoading ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.loading}</p>
              ) : sortedUsers.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.usersEmpty}</p>
              ) : (
                <div className="space-y-2">
                  {sortedUsers.map((user) => {
                    const role = roleByUserId[user.id] ?? user.role ?? '';
                    const isSavingThisUser = savingUserId === user.id;
                    const hasRoleChanged = role !== (user.role ?? '');

                    return (
                      <div
                        key={user.id}
                        className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 space-y-3"
                      >
                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                          <div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{t.nameLabel}</p>
                            <p className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
                              {user.fullName || user.primaryEmail || user.id}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{t.emailLabel}</p>
                            <p className="text-sm text-zinc-900 dark:text-zinc-100 truncate">
                              {user.primaryEmail || user.id}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{t.createdAtLabel}</p>
                            <p className="text-sm text-zinc-900 dark:text-zinc-100">
                              {formatDate(user.createdAt, locale, t.never)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {t.lastSignInLabel}
                            </p>
                            <p className="text-sm text-zinc-900 dark:text-zinc-100">
                              {formatDate(user.lastSignInAt, locale, t.never)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                          <div className="sm:w-56">
                            <label
                              htmlFor={`role-${user.id}`}
                              className="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1"
                            >
                              {t.roleLabel}
                            </label>
                            <select
                              id={`role-${user.id}`}
                              data-testid={`role-select-${user.id}`}
                              value={role}
                              onChange={(event) =>
                                handleRoleChange(user.id, event.target.value as RoleSelectValue)
                              }
                              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100"
                            >
                              <option value="">{t.unassignedRoleLabel}</option>
                              {APP_USER_ROLES.map((roleOption) => (
                                <option key={roleOption} value={roleOption}>
                                  {t.roleOptionLabels[roleOption]}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            type="button"
                            data-testid={`save-role-${user.id}`}
                            disabled={!hasRoleChanged || isSavingThisUser}
                            onClick={() => handleSaveRole(user.id)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                            {t.saveRole}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
