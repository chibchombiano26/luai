'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  AccentTheme,
  Theme,
  applyAccentTheme,
  applyTheme,
  resolveInitialAccentTheme,
  resolveInitialTheme,
  writeStoredAccentTheme,
  writeStoredTheme,
} from '@/lib/theme';

/** Public shape exposed by the theme context and consumed by theme-aware hooks. */
export interface ThemeContextValue {
  theme: Theme;
  accentTheme: AccentTheme;
  toggleTheme: () => void;
  setAccentTheme: (accentTheme: AccentTheme) => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    typeof window === 'undefined' ? 'light' : resolveInitialTheme()
  );
  const [accentTheme, setAccentThemeState] = useState<AccentTheme>(() =>
    typeof window === 'undefined' ? 'blue' : resolveInitialAccentTheme()
  );
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    applyTheme(theme);
    applyAccentTheme(accentTheme);
  }, [theme, accentTheme]);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      const nextTheme = prevTheme === 'light' ? 'dark' : 'light';
      writeStoredTheme(nextTheme);
      return nextTheme;
    });
  }, []);

  const setAccentTheme = useCallback((nextAccentTheme: AccentTheme) => {
    setAccentThemeState(nextAccentTheme);
    writeStoredAccentTheme(nextAccentTheme);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      accentTheme,
      toggleTheme,
      setAccentTheme,
      mounted,
    }),
    [theme, accentTheme, toggleTheme, setAccentTheme, mounted]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'light',
      accentTheme: 'blue',
      toggleTheme: () => {},
      setAccentTheme: () => {},
      mounted: false,
    };
  }
  return context;
}
