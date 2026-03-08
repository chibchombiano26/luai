import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InstallPromptBanner } from './InstallPromptBanner';

const DISMISSED_AT_KEY = 'luai_pwa_install_dismissed_at';

interface MockBeforeInstallPromptEvent extends Event {
  prompt: ReturnType<typeof vi.fn>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function createBeforeInstallPromptEvent(
  outcome: 'accepted' | 'dismissed' = 'dismissed'
): MockBeforeInstallPromptEvent {
  const event = new Event('beforeinstallprompt') as MockBeforeInstallPromptEvent;
  Object.defineProperty(event, 'prompt', {
    configurable: true,
    value: vi.fn().mockResolvedValue(undefined),
  });
  Object.defineProperty(event, 'userChoice', {
    configurable: true,
    value: Promise.resolve({ outcome, platform: 'web' }),
  });
  return event;
}

describe('InstallPromptBanner', () => {
  const now = new Date('2026-03-10T08:00:00.000Z').valueOf();

  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(now);
    localStorage.clear();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    Object.defineProperty(window.navigator, 'standalone', {
      configurable: true,
      value: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows banner when install prompt event is available', async () => {
    render(<InstallPromptBanner />);

    await act(async () => {
      window.dispatchEvent(createBeforeInstallPromptEvent('dismissed'));
    });

    expect(await screen.findByRole('dialog', { name: /instalar aplicacion/i })).toBeInTheDocument();
    expect(screen.getByText(/instala luai/i)).toBeInTheDocument();
  });

  it('stores dismissal when clicking no thanks and hides banner', async () => {
    render(<InstallPromptBanner />);

    await act(async () => {
      window.dispatchEvent(createBeforeInstallPromptEvent('dismissed'));
    });

    const dismissButton = await screen.findByRole('button', { name: /no gracias/i });
    await act(async () => {
      fireEvent.click(dismissButton);
    });

    expect(localStorage.getItem(DISMISSED_AT_KEY)).toBe(String(Date.now()));
    expect(screen.queryByRole('dialog', { name: /instalar aplicacion/i })).not.toBeInTheDocument();
  });

  it('stores dismissal when user dismisses native install prompt', async () => {
    render(<InstallPromptBanner />);

    const event = createBeforeInstallPromptEvent('dismissed');
    await act(async () => {
      window.dispatchEvent(event);
    });

    const installButton = await screen.findByRole('button', { name: /instalar/i });
    await act(async () => {
      fireEvent.click(installButton);
    });

    expect(event.prompt).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(DISMISSED_AT_KEY)).toBe(String(Date.now()));
    expect(screen.queryByRole('dialog', { name: /instalar aplicacion/i })).not.toBeInTheDocument();
  });

  it('does not show banner if user already dismissed before', async () => {
    localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
    render(<InstallPromptBanner />);

    await act(async () => {
      window.dispatchEvent(createBeforeInstallPromptEvent('dismissed'));
    });

    expect(screen.queryByRole('dialog', { name: /instalar aplicacion/i })).not.toBeInTheDocument();
  });

  it('shows banner again after dismissal window expires', async () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISSED_AT_KEY, String(eightDaysAgo));
    render(<InstallPromptBanner />);

    await act(async () => {
      window.dispatchEvent(createBeforeInstallPromptEvent('dismissed'));
    });

    expect(await screen.findByRole('dialog', { name: /instalar aplicacion/i })).toBeInTheDocument();
  });

  it('marks installation as complete when user accepts native prompt', async () => {
    render(<InstallPromptBanner />);

    const event = createBeforeInstallPromptEvent('accepted');
    await act(async () => {
      window.dispatchEvent(event);
    });

    const installButton = await screen.findByRole('button', { name: /instalar/i });
    await act(async () => {
      fireEvent.click(installButton);
    });

    expect(event.prompt).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(DISMISSED_AT_KEY)).toBeNull();
    expect(screen.queryByRole('dialog', { name: /instalar aplicacion/i })).not.toBeInTheDocument();
  });

  it('hides banner when appinstalled event is fired', async () => {
    render(<InstallPromptBanner />);

    await act(async () => {
      window.dispatchEvent(createBeforeInstallPromptEvent('dismissed'));
    });

    expect(await screen.findByRole('dialog', { name: /instalar aplicacion/i })).toBeInTheDocument();

    await act(async () => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    expect(screen.queryByRole('dialog', { name: /instalar aplicacion/i })).not.toBeInTheDocument();
  });

  it('handles prompt failures without persisting dismissal', async () => {
    render(<InstallPromptBanner />);

    const event = createBeforeInstallPromptEvent('dismissed');
    event.prompt.mockRejectedValueOnce(new Error('prompt failed'));

    await act(async () => {
      window.dispatchEvent(event);
    });

    const installButton = await screen.findByRole('button', { name: /instalar/i });
    await act(async () => {
      fireEvent.click(installButton);
    });

    expect(screen.queryByRole('dialog', { name: /instalar aplicacion/i })).not.toBeInTheDocument();
    expect(localStorage.getItem(DISMISSED_AT_KEY)).toBeNull();
  });
});
