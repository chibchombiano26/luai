import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const themeMocks = vi.hoisted(() => ({
  applyTheme: vi.fn(),
  applyAccentTheme: vi.fn(),
  resolveInitialTheme: vi.fn(() => 'dark'),
  resolveInitialAccentTheme: vi.fn(() => 'emerald'),
  writeStoredTheme: vi.fn(),
  writeStoredAccentTheme: vi.fn(),
}));

vi.mock('@/lib/theme', () => ({
  applyTheme: themeMocks.applyTheme,
  applyAccentTheme: themeMocks.applyAccentTheme,
  resolveInitialTheme: themeMocks.resolveInitialTheme,
  resolveInitialAccentTheme: themeMocks.resolveInitialAccentTheme,
  writeStoredTheme: themeMocks.writeStoredTheme,
  writeStoredAccentTheme: themeMocks.writeStoredAccentTheme,
}));

import { ThemeProvider, useThemeContext } from './ThemeProvider';

function ThemeProbe() {
  const { theme, accentTheme, mounted } = useThemeContext();
  return (
    <span>
      {theme}-{accentTheme}-{String(mounted)}
    </span>
  );
}

describe('ThemeProvider SSR', () => {
  it('uses safe defaults on server render when window is unavailable', () => {
    const originalWindow = globalThis.window;
    vi.stubGlobal('window', undefined);
    let html = '';
    try {
      html = renderToString(
        <ThemeProvider>
          <ThemeProbe />
        </ThemeProvider>
      );
    } finally {
      vi.stubGlobal('window', originalWindow);
    }

    const normalized = html.replace(/<!-- -->/g, '').replace(/<\/?span>/g, '');
    expect(normalized).toBe('light-blue-false');
    expect(themeMocks.resolveInitialTheme).not.toHaveBeenCalled();
    expect(themeMocks.resolveInitialAccentTheme).not.toHaveBeenCalled();
    expect(themeMocks.applyTheme).not.toHaveBeenCalled();
    expect(themeMocks.applyAccentTheme).not.toHaveBeenCalled();
  });
});
