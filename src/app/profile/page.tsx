'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AvatarBadge } from '@/components/avatar/AvatarBadge';
import {
  getProfileWidgetSectionId,
  ProfileSideNav,
  PROFILE_SECTION_IDS,
} from '@/components/profile/ProfileSideNav';
import { AppLocale } from '@/lib/i18n';
import { GENERATED_FLOW_PACK_UI_MODULES } from '@/lib/platform/generated-flow-pack-ui';
import { getFlowPackProfileWidgetRegistrations } from '@/lib/platform/pack-ui';
import type { ProfileResponse } from '@/lib/profile/types';
import { createAvatarDataUrl } from '@/lib/profile/avatar-upload';
import { useAppLocale } from '@/hooks/useAppLocale';

const RECENT_EVENTS_PAGE_SIZE = 5;
const DEFAULT_PROFILE_UI_SETTINGS = {
  showUsageSummary: true,
  showDailyUsageChart: true,
  showRecentTokenEvents: true,
} as const;

const DEFAULT_AVATAR_SETTINGS = {
  globalAssistantPreset: 'default',
  assistant: {
    mode: 'default',
    imageUrl: null,
  },
  user: {
    mode: 'default',
    imageUrl: null,
  },
} as const;

const PROFILE_COPY: Record<
  AppLocale,
  {
    title: string;
    subtitle: string;
    backToChat: string;
    loading: string;
    loadError: string;
    user: string;
    totalTokens: string;
    totalInputTokens: string;
    totalOutputTokens: string;
    tokens30Days: string;
    last14Days: string;
    noUsageYet: string;
    tokensSuffix: string;
    recentEvents: string;
    noActivityYet: string;
    previous: string;
    next: string;
    page: string;
    exportExcel: string;
    date: string;
    model: string;
    input: string;
    output: string;
    total: string;
    avatarSectionTitle: string;
    avatarSectionHint: string;
    assistantAvatarLabel: string;
    assistantAvatarHint: string;
    userAvatarLabel: string;
    userAvatarHint: string;
    uploadImage: string;
    removeCustomAvatar: string;
    saveAvatars: string;
    savingAvatars: string;
    avatarSaveSuccess: string;
    avatarSaveError: string;
    avatarUploadError: string;
    avatarUsesCustomImage: string;
    avatarUsesAdminPreset: string;
    avatarUsesDefaultIcon: string;
  }
> = {
  es: {
    title: 'Perfil',
    subtitle: 'Resumen del consumo de tokens.',
    backToChat: 'Volver al chat',
    loading: 'Cargando perfil...',
    loadError: 'No se pudo cargar la informacion del perfil.',
    user: 'Usuario',
    totalTokens: 'Tokens totales',
    totalInputTokens: 'Tokens de entrada',
    totalOutputTokens: 'Tokens de salida',
    tokens30Days: 'Tokens (30 dias)',
    last14Days: 'Ultimos 14 dias',
    noUsageYet: 'Aun no hay consumo registrado.',
    tokensSuffix: 'tokens',
    recentEvents: 'Ultimos eventos de tokens',
    noActivityYet: 'Sin actividad todavia.',
    previous: 'Anterior',
    next: 'Siguiente',
    page: 'Pagina',
    exportExcel: 'Exportar a Excel',
    date: 'Fecha',
    model: 'Modelo',
    input: 'In',
    output: 'Out',
    total: 'Total',
    avatarSectionTitle: 'Avatares',
    avatarSectionHint: 'Puedes subir un avatar para ti y otro para la AI solo en tu cuenta.',
    assistantAvatarLabel: 'Avatar de la AI',
    assistantAvatarHint: 'Si subes uno, reemplaza el avatar global configurado por el admin solo para tu usuario.',
    userAvatarLabel: 'Tu avatar',
    userAvatarHint: 'Se mostrara junto a tus mensajes en el chat.',
    uploadImage: 'Subir imagen',
    removeCustomAvatar: 'Quitar personalizado',
    saveAvatars: 'Guardar avatares',
    savingAvatars: 'Guardando avatares...',
    avatarSaveSuccess: 'Avatares guardados.',
    avatarSaveError: 'No se pudieron guardar los avatares.',
    avatarUploadError: 'No se pudo procesar la imagen.',
    avatarUsesCustomImage: 'Usando imagen personalizada.',
    avatarUsesAdminPreset: 'Usando imagen global definida por admin.',
    avatarUsesDefaultIcon: 'Usando icono por defecto.',
  },
  en: {
    title: 'Profile',
    subtitle: 'Token usage summary.',
    backToChat: 'Back to chat',
    loading: 'Loading profile...',
    loadError: 'Could not load profile information.',
    user: 'User',
    totalTokens: 'Total tokens',
    totalInputTokens: 'Input tokens',
    totalOutputTokens: 'Output tokens',
    tokens30Days: 'Tokens (30 days)',
    last14Days: 'Last 14 days',
    noUsageYet: 'No usage has been recorded yet.',
    tokensSuffix: 'tokens',
    recentEvents: 'Recent token events',
    noActivityYet: 'No activity yet.',
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
    exportExcel: 'Export to Excel',
    date: 'Date',
    model: 'Model',
    input: 'In',
    output: 'Out',
    total: 'Total',
    avatarSectionTitle: 'Avatars',
    avatarSectionHint: 'Upload one avatar for yourself and another one for the AI in your account only.',
    assistantAvatarLabel: 'AI avatar',
    assistantAvatarHint: 'If you upload one, it overrides the global AI avatar selected by admin only for you.',
    userAvatarLabel: 'Your avatar',
    userAvatarHint: 'It is shown next to your messages in chat.',
    uploadImage: 'Upload image',
    removeCustomAvatar: 'Remove custom',
    saveAvatars: 'Save avatars',
    savingAvatars: 'Saving avatars...',
    avatarSaveSuccess: 'Avatars saved.',
    avatarSaveError: 'Could not save avatars.',
    avatarUploadError: 'Could not process the image.',
    avatarUsesCustomImage: 'Using custom image.',
    avatarUsesAdminPreset: 'Using admin-selected global image.',
    avatarUsesDefaultIcon: 'Using default icon.',
  },
};

function getLocaleTag(locale: AppLocale): string {
  return locale === 'en' ? 'en-US' : 'es-CO';
}

function formatNumber(value: number, locale: AppLocale): string {
  return new Intl.NumberFormat(getLocaleTag(locale)).format(value);
}

function formatDate(value: string, locale: AppLocale): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(getLocaleTag(locale), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function exportUsageEventsToExcel(
  events: ProfileResponse['usage']['recentEvents'],
  locale: AppLocale,
  labels: Pick<
    (typeof PROFILE_COPY)[AppLocale],
    'date' | 'model' | 'input' | 'output' | 'total'
  >
) {
  const rows = events
    .map(
      (event) => `
        <tr>
          <td>${escapeHtml(formatDate(event.createdAt, locale))}</td>
          <td>${escapeHtml(event.model)}</td>
          <td>${escapeHtml(formatNumber(event.inputTokens, locale))}</td>
          <td>${escapeHtml(formatNumber(event.outputTokens, locale))}</td>
          <td>${escapeHtml(formatNumber(event.totalTokens, locale))}</td>
        </tr>`
    )
    .join('');

  const html = `
    <html>
      <head>
        <meta charset="utf-8" />
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>${escapeHtml(labels.date)}</th>
              <th>${escapeHtml(labels.model)}</th>
              <th>${escapeHtml(labels.input)}</th>
              <th>${escapeHtml(labels.output)}</th>
              <th>${escapeHtml(labels.total)}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `profile-token-events-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export default function ProfilePage() {
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentEventsPage, setRecentEventsPage] = useState(0);
  const [avatarDraft, setAvatarDraft] = useState({
    assistantCustomDataUrl: null as string | null,
    userCustomDataUrl: null as string | null,
  });
  const [isSavingAvatars, setIsSavingAvatars] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState<string | null>(null);
  const { locale, changeLocale } = useAppLocale('es');

  useEffect(() => {
    let mounted = true;

    const fetchProfile = async () => {
      const storedLocale = locale;

      try {
        setIsLoading(true);
        const response = await fetch('/api/profile', {
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('load-profile-failed');
        }

        const json = (await response.json()) as ProfileResponse;
        if (!mounted) return;
        setData(json);
        setRecentEventsPage(0);
        setError(null);
      } catch {
        if (!mounted) return;
        setError(PROFILE_COPY[storedLocale].loadError);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [locale]);

  const maxDailyTokens = useMemo(() => {
    if (!data || data.usage.dailyUsage.length === 0) return 1;
    return Math.max(...data.usage.dailyUsage.map((day) => day.totalTokens), 1);
  }, [data]);
  const profileWidgets = useMemo(
    () => getFlowPackProfileWidgetRegistrations(GENERATED_FLOW_PACK_UI_MODULES),
    []
  );
  const recentEventsPageCount = useMemo(() => {
    if (!data) return 1;
    return Math.max(Math.ceil(data.usage.recentEvents.length / RECENT_EVENTS_PAGE_SIZE), 1);
  }, [data]);
  const paginatedRecentEvents = useMemo(() => {
    if (!data) return [];
    const start = recentEventsPage * RECENT_EVENTS_PAGE_SIZE;
    return data.usage.recentEvents.slice(start, start + RECENT_EVENTS_PAGE_SIZE);
  }, [data, recentEventsPage]);

  const t = PROFILE_COPY[locale];
  const uiSettings = data?.uiSettings ?? DEFAULT_PROFILE_UI_SETTINGS;
  const avatarSettings = data?.avatarSettings ?? DEFAULT_AVATAR_SETTINGS;

  useEffect(() => {
    if (!data?.avatarSettings) {
      setAvatarDraft({
        assistantCustomDataUrl: null,
        userCustomDataUrl: null,
      });
      return;
    }

    setAvatarDraft({
      assistantCustomDataUrl:
        data.avatarSettings.assistant.mode === 'custom'
          ? data.avatarSettings.assistant.imageUrl
          : null,
      userCustomDataUrl:
        data.avatarSettings.user.mode === 'custom' ? data.avatarSettings.user.imageUrl : null,
    });
  }, [data]);

  const assistantAvatarPreviewUrl =
    avatarDraft.assistantCustomDataUrl ??
    (avatarSettings.assistant.mode === 'custom' ? null : avatarSettings.assistant.imageUrl);
  const userAvatarPreviewUrl = avatarDraft.userCustomDataUrl;

  const assistantAvatarStatus = avatarDraft.assistantCustomDataUrl
    ? t.avatarUsesCustomImage
    : avatarSettings.globalAssistantPreset !== 'default'
      ? t.avatarUsesAdminPreset
      : t.avatarUsesDefaultIcon;
  const userAvatarStatus = avatarDraft.userCustomDataUrl
    ? t.avatarUsesCustomImage
    : t.avatarUsesDefaultIcon;

  const handleAvatarFileChange =
    (target: 'assistantCustomDataUrl' | 'userCustomDataUrl') =>
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';

      if (!file) return;

      setAvatarError(null);
      setAvatarSuccess(null);

      try {
        const nextImageDataUrl = await createAvatarDataUrl(file);
        setAvatarDraft((previous) => ({
          ...previous,
          [target]: nextImageDataUrl,
        }));
      } catch (avatarUploadError) {
        setAvatarError(
          avatarUploadError instanceof Error ? avatarUploadError.message : t.avatarUploadError
        );
      }
    };

  const handleRemoveCustomAvatar = (target: 'assistantCustomDataUrl' | 'userCustomDataUrl') => {
    setAvatarError(null);
    setAvatarSuccess(null);
    setAvatarDraft((previous) => ({
      ...previous,
      [target]: null,
    }));
  };

  const handleSaveAvatars = async () => {
    setIsSavingAvatars(true);
    setAvatarError(null);
    setAvatarSuccess(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          avatarSettings: avatarDraft,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        avatarSettings?: ProfileResponse['avatarSettings'];
      };

      if (!response.ok) {
        throw new Error(payload.error ?? t.avatarSaveError);
      }

      if (payload.avatarSettings) {
        const nextAvatarSettings = payload.avatarSettings;
        setData((previous) =>
          previous
            ? {
                ...previous,
                avatarSettings: nextAvatarSettings,
              }
            : previous
        );
      }

      setAvatarSuccess(t.avatarSaveSuccess);
    } catch (avatarSaveError) {
      setAvatarError(
        avatarSaveError instanceof Error ? avatarSaveError.message : t.avatarSaveError
      );
    } finally {
      setIsSavingAvatars(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <AdminPageHeader
        locale={locale}
        title={t.title}
        subtitle={t.subtitle}
        backLabel={t.backToChat}
        onChangeLocale={changeLocale}
      />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside>
            <ProfileSideNav locale={locale} widgets={profileWidgets} uiSettings={data?.uiSettings} />
          </aside>
          <section className="min-w-0 space-y-6">

          {isLoading && (
            <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.loading}</p>
            </section>
          )}

          {!isLoading && error && (
            <section className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </section>
          )}

          {!isLoading && data && (
            <>
              <section
                id={PROFILE_SECTION_IDS.user}
                className="profile-scroll-section scroll-mt-24 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t.user}</h2>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {data.profile.displayName}
                  </span>
                </p>
                <div className="mt-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {t.avatarSectionTitle}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {t.avatarSectionHint}
                    </p>
                  </div>

                  {avatarError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                      {avatarError}
                    </div>
                  ) : null}

                  {avatarSuccess ? (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
                      {avatarSuccess}
                    </div>
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
                      <div className="flex items-center gap-3">
                        <AvatarBadge
                          role="assistant"
                          imageUrl={assistantAvatarPreviewUrl}
                          size="lg"
                        />
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {t.assistantAvatarLabel}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {assistantAvatarStatus}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                        {t.assistantAvatarHint}
                      </p>
                      <label className="mt-4 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        {t.uploadImage}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          className="mt-2 block w-full text-xs text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-white dark:text-zinc-300"
                          onChange={handleAvatarFileChange('assistantCustomDataUrl')}
                        />
                      </label>
                      {avatarDraft.assistantCustomDataUrl ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomAvatar('assistantCustomDataUrl')}
                          className="mt-3 rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          {t.removeCustomAvatar}
                        </button>
                      ) : null}
                    </div>

                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
                      <div className="flex items-center gap-3">
                        <AvatarBadge role="user" imageUrl={userAvatarPreviewUrl} size="lg" />
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {t.userAvatarLabel}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {userAvatarStatus}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                        {t.userAvatarHint}
                      </p>
                      <label className="mt-4 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        {t.uploadImage}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          className="mt-2 block w-full text-xs text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-white dark:text-zinc-300"
                          onChange={handleAvatarFileChange('userCustomDataUrl')}
                        />
                      </label>
                      {avatarDraft.userCustomDataUrl ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomAvatar('userCustomDataUrl')}
                          className="mt-3 rounded-lg border border-zinc-300 px-3 py-2 text-xs text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          {t.removeCustomAvatar}
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleSaveAvatars()}
                    disabled={isSavingAvatars}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSavingAvatars ? t.savingAvatars : t.saveAvatars}
                  </button>
                </div>
              </section>

              {profileWidgets.length > 0 && (
                <div className="space-y-3">
                  {profileWidgets.map((widget) => (
                    <section
                      key={widget.id}
                      id={getProfileWidgetSectionId(widget.id)}
                      className="profile-scroll-section scroll-mt-24"
                    >
                      <widget.Component
                        locale={locale}
                        profile={data.profile}
                        usage={data.usage}
                      />
                    </section>
                  ))}
                </div>
              )}

              {uiSettings.showUsageSummary ? (
              <section
                id={PROFILE_SECTION_IDS.usageSummary}
                className="profile-scroll-section scroll-mt-24 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
              >
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.totalTokens}</p>
                  <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatNumber(data.usage.totalTokens, locale)}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.totalInputTokens}</p>
                  <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatNumber(data.usage.totalInputTokens, locale)}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.totalOutputTokens}</p>
                  <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatNumber(data.usage.totalOutputTokens, locale)}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.tokens30Days}</p>
                  <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                    {formatNumber(data.usage.last30DaysTokens, locale)}
                  </p>
                </div>
                </section>
              ) : null}

              {uiSettings.showDailyUsageChart ? (
              <section
                id={PROFILE_SECTION_IDS.dailyUsage}
                className="profile-scroll-section scroll-mt-24 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t.last14Days}</h2>
                {data.usage.dailyUsage.length === 0 ? (
                  <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">{t.noUsageYet}</p>
                ) : (
                  <div className="mt-4 space-y-2">
                    {data.usage.dailyUsage.map((item) => (
                      <div key={item.day} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400">
                          <span>{item.day}</span>
                          <span>
                            {formatNumber(item.totalTokens, locale)} {t.tokensSuffix}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <div
                            className="h-full bg-blue-600"
                            style={{ width: `${Math.max((item.totalTokens / maxDailyTokens) * 100, 2)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </section>
              ) : null}

              {uiSettings.showRecentTokenEvents ? (
              <section
                id={PROFILE_SECTION_IDS.recentEvents}
                className="profile-scroll-section scroll-mt-24 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t.recentEvents}</h2>
                  {data.usage.recentEvents.length > 0 && (
                    <button
                      type="button"
                      onClick={() => exportUsageEventsToExcel(data.usage.recentEvents, locale, t)}
                      className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      {t.exportExcel}
                    </button>
                  )}
                </div>
                {data.usage.recentEvents.length === 0 ? (
                  <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">{t.noActivityYet}</p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                          <th className="py-2 pr-3">{t.date}</th>
                          <th className="py-2 pr-3">{t.model}</th>
                          <th className="py-2 pr-3">{t.input}</th>
                          <th className="py-2 pr-3">{t.output}</th>
                          <th className="py-2">{t.total}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedRecentEvents.map((event) => (
                          <tr
                            key={event.id}
                            className="border-b border-zinc-100 text-zinc-700 dark:border-zinc-800/70 dark:text-zinc-300"
                          >
                            <td className="whitespace-nowrap py-2 pr-3">
                              {formatDate(event.createdAt, locale)}
                            </td>
                            <td className="py-2 pr-3">{event.model}</td>
                            <td className="py-2 pr-3">{formatNumber(event.inputTokens, locale)}</td>
                            <td className="py-2 pr-3">{formatNumber(event.outputTokens, locale)}</td>
                            <td className="py-2">{formatNumber(event.totalTokens, locale)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {t.page} {recentEventsPage + 1} / {recentEventsPageCount}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setRecentEventsPage((current) => Math.max(current - 1, 0))}
                          disabled={recentEventsPage === 0}
                          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          {t.previous}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setRecentEventsPage((current) =>
                              Math.min(current + 1, recentEventsPageCount - 1)
                            )
                          }
                          disabled={recentEventsPage >= recentEventsPageCount - 1}
                          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          {t.next}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                </section>
              ) : null}

            </>
          )}
          </section>
        </div>
      </div>
    </main>
  );
}
