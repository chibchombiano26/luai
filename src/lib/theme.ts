export type Theme = 'light' | 'dark';
export type AccentTheme =
  | 'blue'
  | 'emerald'
  | 'rose'
  | 'amber'
  | 'violet'
  | 'cyan'
  | 'indigo'
  | 'teal';

const THEME_STORAGE_KEY = 'theme';
const ACCENT_THEME_STORAGE_KEY = 'accent_theme';
const DEFAULT_ACCENT_THEME: AccentTheme = 'blue';

export const ACCENT_THEMES: AccentTheme[] = [
  'blue',
  'emerald',
  'rose',
  'amber',
  'violet',
  'cyan',
  'indigo',
  'teal',
];

function isAccentTheme(value: string): value is AccentTheme {
  return ACCENT_THEMES.includes(value as AccentTheme);
}

export function readStoredTheme(): Theme | null {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return raw === 'light' || raw === 'dark' ? raw : null;
  } catch {
    return null;
  }
}

export function writeStoredTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage failures (private mode / restricted storage).
  }
}

export function readStoredAccentTheme(): AccentTheme | null {
  try {
    const raw = localStorage.getItem(ACCENT_THEME_STORAGE_KEY);
    return raw && isAccentTheme(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function writeStoredAccentTheme(accentTheme: AccentTheme): void {
  try {
    localStorage.setItem(ACCENT_THEME_STORAGE_KEY, accentTheme);
  } catch {
    // Ignore storage failures (private mode / restricted storage).
  }
}

export function getSystemTheme(): Theme {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;

  const isDark = theme === 'dark';
  const html = document.documentElement;
  const body = document.body;

  html.classList.toggle('dark', isDark);
  html.setAttribute('data-theme', theme);

  if (body) {
    body.classList.toggle('dark', isDark);
    body.setAttribute('data-theme', theme);
  }
}

export function applyAccentTheme(accentTheme: AccentTheme): void {
  if (typeof document === 'undefined') return;

  const html = document.documentElement;
  const body = document.body;

  html.setAttribute('data-accent', accentTheme);
  if (body) {
    body.setAttribute('data-accent', accentTheme);
  }
}

export function resolveInitialTheme(): Theme {
  return readStoredTheme() ?? getSystemTheme();
}

export function resolveInitialAccentTheme(): AccentTheme {
  return readStoredAccentTheme() ?? DEFAULT_ACCENT_THEME;
}
