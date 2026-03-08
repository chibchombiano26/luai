import { describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { PWARegister } from './PWARegister';

describe('PWARegister', () => {
  it('registers service worker on window load and skips waiting worker', async () => {
    const waitingWorker = { postMessage: vi.fn() };
    const registration = {
      update: vi.fn().mockResolvedValue(undefined),
      waiting: waitingWorker,
      addEventListener: vi.fn(),
    };
    const register = vi.fn().mockResolvedValue(registration);

    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register,
        controller: {},
      },
    });

    render(<PWARegister />);

    await act(async () => {
      window.dispatchEvent(new Event('load'));
      await Promise.resolve();
    });

    expect(register).toHaveBeenCalledWith('/sw.js', { scope: '/' });
    expect(registration.update).toHaveBeenCalled();
    expect(waitingWorker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(registration.addEventListener).toHaveBeenCalledWith('updatefound', expect.any(Function));
  });

  it('registers immediately when the page has already finished loading', async () => {
    const registration = {
      update: vi.fn().mockResolvedValue(undefined),
      waiting: null,
      addEventListener: vi.fn(),
    };
    const register = vi.fn().mockResolvedValue(registration);

    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register,
        controller: {},
      },
    });

    const readyStateDescriptor = Object.getOwnPropertyDescriptor(document, 'readyState');
    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'complete',
    });

    try {
      await act(async () => {
        render(<PWARegister />);
        await Promise.resolve();
      });
    } finally {
      if (readyStateDescriptor) {
        Object.defineProperty(document, 'readyState', readyStateDescriptor);
      }
    }

    expect(register).toHaveBeenCalledWith('/sw.js', { scope: '/' });
    expect(registration.update).toHaveBeenCalled();
  });

  it('does nothing when service workers are not supported', () => {
    const addEventSpy = vi.spyOn(window, 'addEventListener');

    // Ensure the property is actually absent so `'serviceWorker' in navigator` is false.
    Reflect.deleteProperty(
      window.navigator as unknown as Record<string, unknown>,
      'serviceWorker'
    );

    expect(() => render(<PWARegister />)).not.toThrow();
    expect(addEventSpy).not.toHaveBeenCalledWith('load', expect.any(Function));
  });

  it('posts skip waiting when updatefound worker reaches installed state', async () => {
    const newWorker = {
      state: 'installed',
      postMessage: vi.fn(),
      addEventListener: vi.fn(),
    };

    const registration = {
      update: vi.fn().mockResolvedValue(undefined),
      waiting: null,
      installing: newWorker,
      addEventListener: vi.fn(),
    };

    const register = vi.fn().mockResolvedValue(registration);
    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register,
        controller: {},
      },
    });

    render(<PWARegister />);

    await act(async () => {
      window.dispatchEvent(new Event('load'));
      await Promise.resolve();
    });

    const updateFoundHandler = registration.addEventListener.mock.calls.find(
      (call) => call[0] === 'updatefound'
    )?.[1] as (() => void) | undefined;
    expect(updateFoundHandler).toBeTypeOf('function');

    updateFoundHandler?.();
    const stateChangeHandler = newWorker.addEventListener.mock.calls.find(
      (call) => call[0] === 'statechange'
    )?.[1] as (() => void) | undefined;
    expect(stateChangeHandler).toBeTypeOf('function');

    stateChangeHandler?.();
    expect(newWorker.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
  });

  it('handles updatefound when installing worker is unavailable', async () => {
    const registration = {
      update: vi.fn().mockResolvedValue(undefined),
      waiting: null,
      installing: null,
      addEventListener: vi.fn(),
    };

    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register: vi.fn().mockResolvedValue(registration),
        controller: {},
      },
    });

    render(<PWARegister />);
    await act(async () => {
      window.dispatchEvent(new Event('load'));
      await Promise.resolve();
    });

    const updateFoundHandler = registration.addEventListener.mock.calls.find(
      (call) => call[0] === 'updatefound'
    )?.[1] as (() => void) | undefined;

    expect(() => updateFoundHandler?.()).not.toThrow();
  });

  it('does not post skip waiting when there is no active controller', async () => {
    const newWorker = {
      state: 'installed',
      postMessage: vi.fn(),
      addEventListener: vi.fn(),
    };

    const registration = {
      update: vi.fn().mockResolvedValue(undefined),
      waiting: null,
      installing: newWorker,
      addEventListener: vi.fn(),
    };

    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register: vi.fn().mockResolvedValue(registration),
        controller: null,
      },
    });

    render(<PWARegister />);
    await act(async () => {
      window.dispatchEvent(new Event('load'));
      await Promise.resolve();
    });

    const updateFoundHandler = registration.addEventListener.mock.calls.find(
      (call) => call[0] === 'updatefound'
    )?.[1] as (() => void) | undefined;
    updateFoundHandler?.();
    const stateChangeHandler = newWorker.addEventListener.mock.calls.find(
      (call) => call[0] === 'statechange'
    )?.[1] as (() => void) | undefined;
    stateChangeHandler?.();

    expect(newWorker.postMessage).not.toHaveBeenCalled();
  });

  it('logs registration errors and removes load listener on unmount', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const addEventSpy = vi.spyOn(window, 'addEventListener');
    const removeEventSpy = vi.spyOn(window, 'removeEventListener');
    const readyStateDescriptor = Object.getOwnPropertyDescriptor(document, 'readyState');

    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: {
        register: vi.fn().mockRejectedValue(new Error('sw failed')),
        controller: {},
      },
    });

    Object.defineProperty(document, 'readyState', {
      configurable: true,
      get: () => 'loading',
    });

    const { unmount } = render(<PWARegister />);

    try {
      await act(async () => {
        window.dispatchEvent(new Event('load'));
        await Promise.resolve();
      });

      expect(errorSpy).toHaveBeenCalledWith(
        '[PWA] Service worker registration failed:',
        expect.any(Error)
      );

      unmount();
      expect(addEventSpy).toHaveBeenCalledWith('load', expect.any(Function));
      expect(removeEventSpy).toHaveBeenCalledWith('load', expect.any(Function));
    } finally {
      if (readyStateDescriptor) {
        Object.defineProperty(document, 'readyState', readyStateDescriptor);
      }
    }
  });
});
