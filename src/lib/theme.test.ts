import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ACCENT_THEMES,
  applyAccentTheme,
  applyTheme,
  getSystemTheme,
  readStoredAccentTheme,
  readStoredTheme,
  resolveInitialAccentTheme,
  resolveInitialTheme,
  writeStoredAccentTheme,
  writeStoredTheme,
} from './theme';

describe('theme utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-accent');
    document.body.className = '';
    document.body.removeAttribute('data-theme');
    document.body.removeAttribute('data-accent');
    vi.restoreAllMocks();
  });

  it('reads and writes theme and accent values from storage', () => {
    writeStoredTheme('dark');
    writeStoredAccentTheme('teal');

    expect(readStoredTheme()).toBe('dark');
    expect(readStoredAccentTheme()).toBe('teal');
  });

  it('ignores invalid stored values and resolves defaults', () => {
    localStorage.setItem('theme', 'nope');
    localStorage.setItem('accent_theme', 'not-valid');

    expect(readStoredTheme()).toBeNull();
    expect(readStoredAccentTheme()).toBeNull();
    expect(resolveInitialAccentTheme()).toBe('blue');
  });

  it('resolves initial theme from storage before system preference', () => {
    localStorage.setItem('theme', 'light');
    expect(resolveInitialTheme()).toBe('light');
  });

  it('uses system theme when no stored theme is available', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
      })
    );
    localStorage.removeItem('theme');
    expect(getSystemTheme()).toBe('dark');
    expect(resolveInitialTheme()).toBe('dark');
  });

  it('falls back to light when matchMedia throws', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => {
        throw new Error('media query blocked');
      })
    );
    expect(getSystemTheme()).toBe('light');
  });

  it('applies theme and accent attributes to html and body', () => {
    applyTheme('dark');
    applyAccentTheme('indigo');

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.body.classList.contains('dark')).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.body.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.getAttribute('data-accent')).toBe('indigo');
    expect(document.body.getAttribute('data-accent')).toBe('indigo');
  });

  it('handles storage failures safely', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(readStoredTheme()).toBeNull();
    expect(readStoredAccentTheme()).toBeNull();
    expect(() => writeStoredTheme('light')).not.toThrow();
    expect(() => writeStoredAccentTheme(ACCENT_THEMES[0])).not.toThrow();
  });

  it('returns early when document is not available for apply helpers', () => {
    vi.stubGlobal('document', undefined);

    expect(() => applyTheme('dark')).not.toThrow();
    expect(() => applyAccentTheme('blue')).not.toThrow();

    vi.unstubAllGlobals();
  });

  it('applies theme helpers safely when document.body is missing', () => {
    const bodyDescriptor = Object.getOwnPropertyDescriptor(document, 'body');
    Object.defineProperty(document, 'body', {
      configurable: true,
      value: null,
    });

    expect(() => applyTheme('light')).not.toThrow();
    expect(() => applyAccentTheme('cyan')).not.toThrow();

    if (bodyDescriptor) {
      Object.defineProperty(document, 'body', bodyDescriptor);
    }
  });
});
