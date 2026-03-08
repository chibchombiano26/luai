import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { NetworkStatusBanner } from './NetworkStatusBanner';

function setOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value,
  });
}

describe('NetworkStatusBanner', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows offline message when navigator reports offline', async () => {
    setOnline(false);
    render(<NetworkStatusBanner />);

    expect(
      await screen.findByText(/sin conexion\. necesitas internet para usar el chat/i)
    ).toBeInTheDocument();
  });

  it('shows online toast after reconnecting and hides it automatically', () => {
    vi.useFakeTimers();
    setOnline(false);
    render(<NetworkStatusBanner />);
    act(() => {
      // Flush initial mount effect.
    });
    expect(screen.getByText(/sin conexion/i)).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.getByText(/conexion restablecida/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(screen.queryByText(/conexion restablecida/i)).not.toBeInTheDocument();
  });

  it('clears pending online toast when offline event happens again', () => {
    vi.useFakeTimers();
    setOnline(false);
    render(<NetworkStatusBanner />);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(screen.getByText(/conexion restablecida/i)).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.queryByText(/conexion restablecida/i)).not.toBeInTheDocument();
    expect(screen.getByText(/sin conexion/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText(/conexion restablecida/i)).not.toBeInTheDocument();
  });

  it('registers and unregisters online/offline listeners on mount cycle', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<NetworkStatusBanner />);
    unmount();

    expect(addSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('offline', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('handles offline event safely when no online toast timeout exists', () => {
    setOnline(true);
    render(<NetworkStatusBanner />);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByText(/sin conexion/i)).toBeInTheDocument();
  });
});
