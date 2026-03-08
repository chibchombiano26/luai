import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Chat } from '@/components/chat/Chat';
import { ThemeProvider } from '@/components/ThemeProvider';
import { useTheme } from './useTheme';

function ThemeConsumerProbe() {
  const { theme, accentTheme, mounted, toggleTheme, setAccentTheme } = useTheme();

  return (
    <button
      onClick={() => {
        toggleTheme();
        setAccentTheme('emerald');
      }}
    >
      {theme}-{accentTheme}-{String(mounted)}
    </button>
  );
}

describe('Theme System', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    document.documentElement.removeAttribute('data-accent');
    document.body.removeAttribute('data-accent');
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('toggles dark class on html and body when clicking theme button', async () => {
    render(
      <ThemeProvider>
        <Chat />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cambiar a oscuro|switch to dark mode/i })).toBeInTheDocument();
    });

    const toggleToDark = screen.getByRole('button', { name: /cambiar a oscuro|switch to dark mode/i });
    fireEvent.click(toggleToDark);

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.body.classList.contains('dark')).toBe(true);

    const toggleToLight = screen.getByRole('button', { name: /cambiar a claro|switch to light mode/i });
    fireEvent.click(toggleToLight);

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(document.body.classList.contains('dark')).toBe(false);
  });

  it('persists selected accent palette in localStorage and root attributes', async () => {
    render(
      <ThemeProvider>
        <Chat />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^paleta$|^palette$/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /^paleta$|^palette$/i }));
    fireEvent.click(screen.getByRole('button', { name: /paleta esmeralda|palette emerald/i }));

    expect(localStorage.getItem('accent_theme')).toBe('emerald');
    expect(document.documentElement.getAttribute('data-accent')).toBe('emerald');
    expect(document.body.getAttribute('data-accent')).toBe('emerald');
  });

  it('returns safe fallback values when theme hook is used outside provider', () => {
    render(<ThemeConsumerProbe />);

    const fallbackButton = screen.getByRole('button', { name: /light-blue-false/i });
    expect(fallbackButton).toBeInTheDocument();
    fireEvent.click(fallbackButton);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
