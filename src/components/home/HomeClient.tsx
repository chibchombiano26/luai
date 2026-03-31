'use client';

import { SignInButton, useUser } from '@clerk/nextjs';
import {
  ChevronDown,
  FileText,
  Languages,
  ListTree,
  Menu,
  MessageSquareText,
  Settings,
  UserCircle2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { type CSSProperties, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Chat } from '@/components/chat/Chat';
import { AppLocale, normalizeLocale } from '@/lib/i18n';
import { isAdminRole, resolveAppUserRoleFromMetadata } from '@/lib/access/roles';
import {
  ACCENT_THEME_LABELS,
  ACCENT_THEME_SWATCHES,
  LOCALE_STORAGE_KEY,
  LEGACY_LOCALE_STORAGE_KEYS,
} from '@/components/chat/chat-constants';
import { getCompatStorageItem, setCompatStorageItem } from '@/lib/browser-storage';
import { useTheme } from '@/hooks/useTheme';
import { ACCENT_THEMES, type AccentTheme, type Theme } from '@/lib/theme';
import { GENERATED_FLOW_PACK_UI_MODULES } from '@/lib/platform/generated-flow-pack-ui';
import {
  getFlowPackHomeExperienceRegistrations,
  resolveFlowPackHomeExperience,
} from '@/lib/platform/pack-ui';

const AUTH_COPY: Record<
  AppLocale,
  {
    cta: string;
  }
> = {
  es: {
    cta: 'Ingresar a LuAI',
  },
  en: {
    cta: 'Sign in to LuAI',
  },
};

const HOME_COPY: Record<
  AppLocale,
  {
    view: string;
    language: string;
    chat: string;
    wizards: string;
    forms: string;
    availableWizards: string;
    availableForms: string;
    appearance: string;
    lightTheme: string;
    darkTheme: string;
    change: string;
    color: string;
    profile: string;
    admin: string;
    openMenu: string;
  }
> = {
  es: {
    view: 'Vista',
    language: 'Idioma',
    chat: 'Chat',
    wizards: 'Wizards',
    forms: 'Forms',
    availableWizards: 'Wizards disponibles',
    availableForms: 'Formularios disponibles',
    appearance: 'Apariencia',
    lightTheme: 'Tema claro',
    darkTheme: 'Tema oscuro',
    change: 'Cambiar',
    color: 'Color',
    profile: 'Perfil',
    admin: 'Admin',
    openMenu: 'Abrir menú principal',
  },
  en: {
    view: 'View',
    language: 'Language',
    chat: 'Chat',
    wizards: 'Wizards',
    forms: 'Forms',
    availableWizards: 'Available wizards',
    availableForms: 'Available forms',
    appearance: 'Appearance',
    lightTheme: 'Light theme',
    darkTheme: 'Dark theme',
    change: 'Toggle',
    color: 'Color',
    profile: 'Profile',
    admin: 'Admin',
    openMenu: 'Open main menu',
  },
};

const EXPERIENCE_MODE_STORAGE_KEY = 'luai_home_experience_mode';
const HOME_EXPERIENCE_REGISTRATIONS = getFlowPackHomeExperienceRegistrations(
  GENERATED_FLOW_PACK_UI_MODULES
);

type HomeExperienceMode = 'chat' | `experience:${string}:${string}`;
type HomeExperienceCard = {
  id?: unknown;
  enabled?: unknown;
  order?: unknown;
  homeExperiences?: Array<{
    id?: unknown;
    kind?: unknown;
    componentKey?: unknown;
    storageAliases?: unknown;
    order?: unknown;
    label?: {
      es?: unknown;
      en?: unknown;
    };
  }>;
};
type HomeExperienceKind = 'wizard' | 'form';
type HomeExperienceFamily = 'chat' | HomeExperienceKind;
type HomeExperienceOption = {
  mode: HomeExperienceMode;
  cardId: string;
  experienceId: string;
  kind: HomeExperienceKind;
  componentKey: string;
  storageAliases: string[];
  order: number;
  label: {
    es: string;
    en: string;
  };
};
type HomeExperienceMenuOption = {
  value: HomeExperienceMode;
  label: string;
};

const AUTH_VIDEO_VARIANTS = [
  {
    videoSrc: '/api/auth-media/loader-1-lite',
    posterSrc: '/api/auth-media/loader-1-poster',
  },
  {
    videoSrc: '/api/auth-media/loader-2-lite',
    posterSrc: '/api/auth-media/loader-2-poster',
  },
] as const;

function resolveInitialLocale(): AppLocale {
  if (typeof window === 'undefined') {
    return 'es';
  }

  const storedLocale = getCompatStorageItem(
    localStorage,
    LOCALE_STORAGE_KEY,
    LEGACY_LOCALE_STORAGE_KEYS
  );

  return normalizeLocale(storedLocale);
}

function resolveInitialExperienceMode(
  availableExperiences: HomeExperienceOption[]
): HomeExperienceMode {
  const storedMode = localStorage.getItem(EXPERIENCE_MODE_STORAGE_KEY);
  if (
    storedMode === 'chat' ||
    storedMode?.startsWith('experience:')
  ) {
    return storedMode as HomeExperienceMode;
  }

  const aliasedExperience = availableExperiences.find((experience) =>
    experience.storageAliases.includes(String(storedMode ?? ''))
  );
  if (aliasedExperience) {
    return aliasedExperience.mode;
  }

  return 'chat';
}

function createExperienceMode(cardId: string, experienceId: string): HomeExperienceMode {
  return `experience:${cardId}:${experienceId}`;
}

function resolveExperienceKind(rawKind: unknown, experienceId: string, componentKey: string): HomeExperienceKind | null {
  if (rawKind === 'wizard' || rawKind === 'form') {
    return rawKind;
  }

  const normalizedTokens = `${experienceId} ${componentKey}`.toLowerCase();
  if (normalizedTokens.includes('wizard')) {
    return 'wizard';
  }
  if (normalizedTokens.includes('form')) {
    return 'form';
  }

  return null;
}

function resolveAvailableHomeExperiences(cards: HomeExperienceCard[]): HomeExperienceOption[] {
  return cards
    .filter((card) => card?.enabled === true && typeof card?.id === 'string')
    .flatMap((card) => {
      const cardId = card.id as string;
      const cardOrder = typeof card.order === 'number' ? card.order : 0;
      return (Array.isArray(card.homeExperiences) ? card.homeExperiences : [])
        .map((experience) => {
          const experienceId =
            typeof experience?.id === 'string' ? experience.id.trim() : '';
          const componentKey =
            typeof experience?.componentKey === 'string' ? experience.componentKey.trim() : '';
          const kind = resolveExperienceKind(experience?.kind, experienceId, componentKey);
          const registration = componentKey
            ? resolveFlowPackHomeExperience(HOME_EXPERIENCE_REGISTRATIONS, componentKey)
            : null;

          if (!experienceId || !componentKey || !kind || !registration) {
            return null;
          }

          return {
            mode: createExperienceMode(cardId, experienceId),
            cardId,
            experienceId,
            kind,
            componentKey,
            storageAliases: Array.isArray(experience.storageAliases)
              ? experience.storageAliases
                  .map((value) => String(value).trim())
                  .filter(Boolean)
              : [],
            order:
              cardOrder * 1000 + (typeof experience.order === 'number' ? experience.order : 0),
            label: {
              es:
                typeof experience.label?.es === 'string' && experience.label.es.trim()
                  ? experience.label.es
                  : experienceId,
              en:
                typeof experience.label?.en === 'string' && experience.label.en.trim()
                  ? experience.label.en
                  : experienceId,
            },
          } satisfies HomeExperienceOption;
        })
        .filter((experience): experience is HomeExperienceOption => Boolean(experience));
    })
    .sort((a, b) => a.order - b.order || a.mode.localeCompare(b.mode));
}

function HomeExperienceFamilySelector({
  locale,
  currentFamily,
  availableKinds,
  onChange,
  compact = false,
}: {
  locale: AppLocale;
  currentFamily: HomeExperienceFamily;
  availableKinds: Set<HomeExperienceKind>;
  onChange: (family: HomeExperienceFamily) => void;
  compact?: boolean;
}) {
  const copy = HOME_COPY[locale];
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileMenuStyle, setMobileMenuStyle] = useState<CSSProperties>();
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const options: Array<{
    family: HomeExperienceFamily;
    label: string;
    icon: typeof MessageSquareText;
  }> = [
    { family: 'chat', label: copy.chat, icon: MessageSquareText },
    ...(availableKinds.has('wizard')
      ? [{ family: 'wizard' as const, label: copy.wizards, icon: ListTree }]
      : []),
    ...(availableKinds.has('form')
      ? [{ family: 'form' as const, label: copy.forms, icon: FileText }]
      : []),
  ];
  const currentOption = options.find((option) => option.family === currentFamily) ?? options[0];
  const CurrentIcon = currentOption.icon;

  useEffect(() => {
    if (!compact || !mobileOpen) {
      return;
    }

    const updateMenuPosition = () => {
      if (!mobileButtonRef.current) {
        return;
      }

      const rect = mobileButtonRef.current.getBoundingClientRect();
      const menuWidth = Math.min(176, window.innerWidth - 16);
      const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
      const top = rect.bottom + 8;
      setMobileMenuStyle({
        left,
        top,
        width: menuWidth,
      });
    };

    updateMenuPosition();

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target) &&
        mobileButtonRef.current &&
        !mobileButtonRef.current.contains(target)
      ) {
        setMobileOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('resize', updateMenuPosition);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('resize', updateMenuPosition);
    };
  }, [compact, mobileOpen]);

  return (
    <>
      <label
        className={`items-center rounded-2xl border border-zinc-200 bg-white text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 ${
          compact
            ? 'hidden gap-1 px-2 py-1.5 sm:inline-flex'
            : 'hidden w-full justify-between gap-2 px-3 py-2 sm:inline-flex sm:w-auto'
        }`}
        data-testid="home-experience-family-selector"
      >
        {!compact ? (
          <span className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400 sm:inline">
            {copy.view}
          </span>
        ) : null}
        <select
          aria-label="Selector de vista"
          value={currentFamily}
          onChange={(event) => onChange(event.target.value as HomeExperienceFamily)}
          className={`bg-transparent text-sm font-medium text-zinc-900 outline-none dark:text-zinc-100 ${
            compact ? 'min-w-[6.25rem]' : 'min-w-0 flex-1 sm:min-w-[8.5rem]'
          }`}
        >
          {options.map((option) => (
            <option key={option.family} value={option.family}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div
        className={compact ? 'relative sm:hidden' : 'relative w-full sm:hidden'}
        data-testid="home-experience-family-selector-mobile"
        ref={mobileMenuRef}
      >
        <button
          ref={mobileButtonRef}
          type="button"
          aria-label="Abrir selector de vista"
          aria-expanded={mobileOpen}
          aria-haspopup="menu"
          onClick={() => setMobileOpen((current) => !current)}
          className={`inline-flex items-center border border-zinc-300 bg-white text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${
            compact
              ? 'h-8 gap-1 rounded-lg px-2'
              : 'w-full justify-between gap-2 rounded-2xl px-3 py-2'
          }`}
        >
          {compact ? (
            <CurrentIcon className="h-4 w-4" />
          ) : (
            <span className="font-medium">{currentOption.label}</span>
          )}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>

        {mobileOpen && typeof document !== 'undefined'
          ? createPortal(
              <div
                ref={mobileMenuRef}
                role="menu"
                className="fixed z-[70] rounded-xl border border-zinc-200 bg-white p-1 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
                style={mobileMenuStyle}
              >
                {options.map((option) => {
                  const active = option.family === currentFamily;
                  const Icon = option.icon;

                  return (
                    <button
                      key={option.family}
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      onClick={() => {
                        onChange(option.family);
                        setMobileOpen(false);
                      }}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                        active
                          ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200'
                          : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </span>
                      {active ? (
                        <span className="text-[11px] uppercase tracking-[0.16em]">Actual</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>,
              document.body
            )
          : null}
      </div>
    </>
  );
}

function HomeExperienceFamilyMenu({
  locale,
  showAdminLink,
  currentMode,
  currentFamily,
  options,
  onChange,
  onLocaleChange,
  theme,
  accentTheme,
  themeMounted,
  toggleTheme,
  setAccentTheme,
}: {
  locale: AppLocale;
  showAdminLink: boolean;
  currentMode: HomeExperienceMode;
  currentFamily: HomeExperienceFamily;
  options: HomeExperienceMenuOption[];
  onChange: (mode: HomeExperienceMode) => void;
  onLocaleChange: (locale: AppLocale) => void;
  theme: Theme;
  accentTheme: AccentTheme;
  themeMounted: boolean;
  toggleTheme: () => void;
  setAccentTheme: (accentTheme: AccentTheme) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const copy = HOME_COPY[locale];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const familyLabel =
    currentFamily === 'wizard'
      ? copy.availableWizards
      : currentFamily === 'form'
        ? copy.availableForms
        : null;

  return (
    <div className="relative" data-testid="home-experience-menu" ref={menuRef}>
      <button
        type="button"
        aria-label={copy.openMenu}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open ? (
        <div
          className="absolute right-0 top-14 z-50 w-max min-w-[14rem] max-w-[min(20rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-xl border border-zinc-200 bg-white p-1 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
          style={{ maxHeight: 'min(20rem, calc(100vh - 6rem))' }}
          role="menu"
        >
          {familyLabel && options.length > 0 ? (
            <>
              <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                {familyLabel}
              </div>
              {options.map((option) => {
                const isActive = option.value === currentMode;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isActive}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition ${
                      isActive
                        ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200'
                        : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900'
                    }`}
                  >
                    <span className="whitespace-normal leading-snug">{option.label}</span>
                    {isActive ? (
                      <span className="shrink-0 text-xs uppercase tracking-[0.16em]">Actual</span>
                    ) : null}
                  </button>
                );
              })}
              <div className="my-1 border-t border-zinc-200 dark:border-zinc-800" />
            </>
          ) : null}

          <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            {copy.language}
          </div>
          <div className="px-2 pb-2">
            <div className="inline-flex w-full rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
              {(['es', 'en'] as const).map((localeOption) => {
                const active = localeOption === locale;
                return (
                  <button
                    key={localeOption}
                    type="button"
                    onClick={() => {
                      onLocaleChange(localeOption);
                      setOpen(false);
                    }}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-sky-600 text-white'
                        : 'text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {localeOption.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="my-1 border-t border-zinc-200 dark:border-zinc-800" />

          <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            {copy.appearance}
          </div>
          {themeMounted ? (
            <div className="px-2 pb-2">
              <button
                type="button"
                onClick={() => {
                  toggleTheme();
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                <span>{theme === 'dark' ? copy.darkTheme : copy.lightTheme}</span>
                <span className="text-xs uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                  {copy.change}
                </span>
              </button>

              <div className="mt-2 px-2">
                <div className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">{copy.color}</div>
                <div className="grid grid-cols-4 gap-2">
                  {ACCENT_THEMES.map((palette) => (
                    <button
                      key={palette}
                      type="button"
                      aria-label={`${copy.color} ${ACCENT_THEME_LABELS[locale][palette]}`}
                      data-testid={`accent-swatch-${palette}`}
                      onClick={() => {
                        setAccentTheme(palette);
                        setOpen(false);
                      }}
                      className={`h-7 w-7 rounded-full border-2 transition-transform ${
                        accentTheme === palette
                          ? 'scale-110 border-zinc-900 dark:border-zinc-100'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: ACCENT_THEME_SWATCHES[palette] }}
                      title={ACCENT_THEME_LABELS[locale][palette]}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <div className="my-1 border-t border-zinc-200 dark:border-zinc-800" />

          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            <UserCircle2 className="h-4 w-4" />
            <span>{copy.profile}</span>
          </Link>
          {showAdminLink ? (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              <Settings className="h-4 w-4" />
              <span>{copy.admin}</span>
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function LuAiSignInScreen() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [locale, setLocale] = useState<AppLocale>(() => resolveInitialLocale());
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const displayLocale = mounted ? locale : 'es';
  const copy = AUTH_COPY[displayLocale];
  const activeVideo = AUTH_VIDEO_VARIANTS[activeVideoIndex];

  const changeLocale = (nextLocale: AppLocale) => {
    setLocale(nextLocale);
    setCompatStorageItem(
      localStorage,
      LOCALE_STORAGE_KEY,
      nextLocale,
      LEGACY_LOCALE_STORAGE_KEYS
    );
    document.cookie = `app_locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
  };

  const handleVideoEnded = () => {
    setActiveVideoIndex((currentIndex) => (currentIndex + 1) % AUTH_VIDEO_VARIANTS.length);
  };

  return (
    <section className="w-full max-w-3xl mx-auto px-4 py-6 md:px-6 md:py-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-zinc-200 bg-[linear-gradient(180deg,#fbfdff_0%,#eef6ff_100%)] px-5 py-5 shadow-[0_28px_80px_rgba(15,23,42,0.1)] dark:border-zinc-800 dark:bg-[linear-gradient(180deg,#09090b_0%,#111827_100%)] md:px-8 md:py-8">
        <div className="pointer-events-none absolute left-[-14%] top-[-10%] h-56 w-56 rounded-full bg-blue-300/25 blur-3xl dark:bg-blue-500/12" />
        <div className="pointer-events-none absolute bottom-[-12%] right-[-10%] h-56 w-56 rounded-full bg-cyan-200/35 blur-3xl dark:bg-cyan-400/10" />

        <div className="relative z-10 flex justify-end">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/90 px-2 py-1 text-sm text-zinc-600 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300">
            <Languages className="h-4 w-4" />
            <div className="flex items-center gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
              <button
                type="button"
                onClick={() => changeLocale('es')}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  displayLocale === 'es'
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                ES
              </button>
              <button
                type="button"
                onClick={() => changeLocale('en')}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  displayLocale === 'en'
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-5 flex flex-col items-center gap-6 md:mt-6 md:gap-8">
          <div className="relative flex w-full justify-center">
            <div className="pointer-events-none absolute inset-x-8 top-6 h-28 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-500/12 md:inset-x-16" />
            <div className="relative w-full max-w-[420px] rounded-[2.25rem] border border-white/70 bg-white/45 p-3 shadow-[0_36px_100px_rgba(15,23,42,0.16)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 md:max-w-[500px] md:p-4">
              <div className="overflow-hidden rounded-[1.8rem] border border-white/80 bg-white/80 shadow-[0_30px_80px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-zinc-950/55">
                <div className="relative aspect-[16/10] w-full">
                  <Image
                    src={activeVideo.posterSrc}
                    alt="LuAI preview"
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 500px"
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                      videoReady && !videoFailed ? 'opacity-0' : 'opacity-100'
                    }`}
                  />
                  <video
                    key={activeVideo.videoSrc}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                      videoReady && !videoFailed ? 'opacity-100' : 'opacity-0'
                    }`}
                    autoPlay
                    muted
                    playsInline
                    preload="auto"
                    poster={activeVideo.posterSrc}
                    src={activeVideo.videoSrc}
                    onLoadStart={() => {
                      setVideoReady(false);
                      setVideoFailed(false);
                    }}
                    onCanPlay={() => setVideoReady(true)}
                    onLoadedData={() => setVideoReady(true)}
                    onPlaying={() => setVideoReady(true)}
                    onError={() => setVideoFailed(true)}
                    onEnded={handleVideoEnded}
                  />
                </div>
              </div>
            </div>
          </div>

          <SignInButton mode="redirect" fallbackRedirectUrl="/" forceRedirectUrl="/">
            <button
              type="button"
              className="inline-flex h-12 items-center justify-center rounded-full bg-blue-600 px-6 text-sm font-semibold text-white transition-colors shadow-[0_12px_30px_rgba(37,99,235,0.28)] hover:bg-blue-700"
            >
              {copy.cta}
            </button>
          </SignInButton>
        </div>
      </div>
    </section>
  );
}

function ClerkAwareHome() {
  const { isLoaded, isSignedIn, user } = useUser();

  const showAdminLink = useMemo(() => {
    if (!isLoaded || !isSignedIn) {
      return false;
    }

    const role = resolveAppUserRoleFromMetadata(user?.publicMetadata);
    return isAdminRole(role);
  }, [isLoaded, isSignedIn, user?.publicMetadata]);

  if (isLoaded && isSignedIn) {
    return <HomeExperienceShell clerkEnabled showAdminLink={showAdminLink} />;
  }

  return <LuAiSignInScreen />;
}

function HomeExperienceShell({
  clerkEnabled,
  showAdminLink = true,
}: {
  clerkEnabled: boolean;
  showAdminLink?: boolean;
}) {
  const {
    theme,
    accentTheme,
    toggleTheme,
    setAccentTheme,
    mounted: themeMounted,
  } = useTheme();
  const [uiLocale, setUiLocale] = useState<AppLocale>('es');
  const [mode, setMode] = useState<HomeExperienceMode>('chat');
  const [availableExperiences, setAvailableExperiences] = useState<HomeExperienceOption[]>([]);
  const [toolbarPortalTarget, setToolbarPortalTarget] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    setUiLocale(resolveInitialLocale());
  }, []);

  const changeUiLocale = (nextLocale: AppLocale) => {
    setUiLocale(nextLocale);
    setCompatStorageItem(
      localStorage,
      LOCALE_STORAGE_KEY,
      nextLocale,
      LEGACY_LOCALE_STORAGE_KEYS
    );
    document.cookie = `app_locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
  };

  const changeMode = (nextMode: HomeExperienceMode) => {
    setMode(nextMode);
    localStorage.setItem(EXPERIENCE_MODE_STORAGE_KEY, nextMode);
  };

  useEffect(() => {
    let cancelled = false;

    const loadAvailableExperiences = async () => {
      try {
        const response = await fetch('/api/platform/cards', {
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('cards-unavailable');
        }

        const payload = (await response.json()) as {
          cards?: HomeExperienceCard[];
        };
        if (cancelled) {
          return;
        }

        const nextExperiences = Array.isArray(payload.cards)
          ? resolveAvailableHomeExperiences(payload.cards)
          : [];

        setAvailableExperiences(nextExperiences);
        if (nextExperiences.length === 0) {
          setMode('chat');
          localStorage.setItem(EXPERIENCE_MODE_STORAGE_KEY, 'chat');
          return;
        }

        const storedMode = resolveInitialExperienceMode(nextExperiences);
        const isStoredModeAvailable = nextExperiences.some(
          (experience) => experience.mode === storedMode
        );
        setMode(isStoredModeAvailable ? storedMode : 'chat');
      } catch {
        if (cancelled) {
          return;
        }
        setAvailableExperiences([]);
        setMode('chat');
        localStorage.setItem(EXPERIENCE_MODE_STORAGE_KEY, 'chat');
      }
    };

    void loadAvailableExperiences();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedExperience = availableExperiences.find((experience) => experience.mode === mode);
  const resolvedMode = selectedExperience ? mode : 'chat';
  const selectedResolvedExperience =
    resolvedMode === 'chat'
      ? null
      : availableExperiences.find((experience) => experience.mode === resolvedMode) ?? null;
  const currentFamily: HomeExperienceFamily = selectedResolvedExperience?.kind ?? 'chat';
  const selectedExperienceRegistration = selectedExperience
    ? resolveFlowPackHomeExperience(
        HOME_EXPERIENCE_REGISTRATIONS,
        selectedExperience.componentKey
      )
    : null;
  const SelectedExperienceComponent = selectedExperienceRegistration?.Component ?? null;
  const availableKinds = useMemo(
    () => new Set(availableExperiences.map((experience) => experience.kind)),
    [availableExperiences]
  );
  const familyOptions = currentFamily === 'chat'
    ? []
    : availableExperiences
        .filter((experience) => experience.kind === currentFamily)
        .map((experience) => ({
          value: experience.mode,
          label: experience.label.es,
        }));

  const [lastModeByFamily, setLastModeByFamily] = useState<Partial<Record<HomeExperienceKind, HomeExperienceMode>>>({});

  useEffect(() => {
    if (selectedResolvedExperience) {
      setLastModeByFamily((current) => ({
        ...current,
        [selectedResolvedExperience.kind]: selectedResolvedExperience.mode,
      }));
    }
  }, [selectedResolvedExperience]);

  const changeFamily = (family: HomeExperienceFamily) => {
    if (family === 'chat') {
      changeMode('chat');
      return;
    }

    const optionsForFamily = availableExperiences.filter((experience) => experience.kind === family);
    if (optionsForFamily.length === 0) {
      return;
    }

    const rememberedMode = lastModeByFamily[family];
    const rememberedOption = rememberedMode
      ? optionsForFamily.find((experience) => experience.mode === rememberedMode)
      : null;

    changeMode((rememberedOption ?? optionsForFamily[0]).mode);
  };

  const showToolbar = availableExperiences.length > 0;
  const chatHeaderAccessory =
    availableExperiences.length > 0 ? (
      <HomeExperienceFamilySelector
        locale={uiLocale}
        currentFamily={currentFamily}
        availableKinds={availableKinds}
        onChange={changeFamily}
        compact
      />
    ) : null;

  return (
    <section className="flex w-full flex-col items-center gap-4 px-4 py-4 md:px-0">
      {showToolbar && currentFamily !== 'chat' ? (
        <div className="w-full max-w-6xl px-1">
          <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 md:flex md:items-center md:justify-end">
            <div className="min-w-0 md:shrink-0">
              <HomeExperienceFamilySelector
                locale={uiLocale}
                currentFamily={currentFamily}
                availableKinds={availableKinds}
                onChange={changeFamily}
              />
            </div>
            <div
              ref={setToolbarPortalTarget}
              className="col-span-2 flex min-h-12 w-full flex-wrap items-center justify-end gap-2 md:col-auto md:min-h-0 md:w-auto md:max-w-full md:flex-nowrap"
              data-testid="home-experience-toolbar-slot"
            />
            <div className="justify-self-end md:shrink-0">
              <HomeExperienceFamilyMenu
                locale={uiLocale}
                showAdminLink={showAdminLink}
                currentMode={resolvedMode}
                currentFamily={currentFamily}
                options={familyOptions}
                onChange={changeMode}
                onLocaleChange={changeUiLocale}
                theme={theme}
                accentTheme={accentTheme}
                themeMounted={themeMounted}
                toggleTheme={toggleTheme}
                setAccentTheme={setAccentTheme}
              />
            </div>
          </div>
        </div>
      ) : null}
      {resolvedMode !== 'chat' && SelectedExperienceComponent && selectedExperience ? (
        <SelectedExperienceComponent
          cardId={selectedExperience.cardId}
          clerkEnabled={clerkEnabled}
          locale={uiLocale}
          toolbarPortalTarget={toolbarPortalTarget}
          onLocaleChange={setUiLocale}
        />
      ) : null}
      {resolvedMode === 'chat' ? (
        <Chat
          clerkEnabled={clerkEnabled}
          onLocaleChange={setUiLocale}
          headerAccessory={chatHeaderAccessory}
        />
      ) : null}
    </section>
  );
}

export function HomeClient({ clerkEnabled }: { clerkEnabled: boolean }) {
  if (!clerkEnabled) {
    return <HomeExperienceShell clerkEnabled={false} />;
  }

  return <ClerkAwareHome />;
}
