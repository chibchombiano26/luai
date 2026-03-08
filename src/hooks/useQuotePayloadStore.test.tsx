import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

type IndexedDbMockOptions = {
  containsStore?: boolean;
  openError?: Error;
  putError?: Error;
  getError?: Error;
  deleteError?: Error;
};

function createIndexedDbMock(options: IndexedDbMockOptions = {}) {
  const records = new Map<string, { id: string; timestamp: number; overrides: Record<string, unknown> }>();

  const createRequest = (executor: () => unknown, forcedError?: Error) => {
    const request: {
      result?: unknown;
      error?: unknown;
      onerror: null | (() => void);
      onsuccess: null | (() => void);
    } = {
      onerror: null,
      onsuccess: null,
    };

    queueMicrotask(() => {
      try {
        if (forcedError) {
          throw forcedError;
        }
        request.result = executor();
        request.onsuccess?.();
      } catch (error) {
        request.error = error;
        request.onerror?.();
      }
    });

    return request;
  };

  const store = {
    put: vi.fn((value: { id: string; timestamp: number; overrides: Record<string, unknown> }) =>
      createRequest(
        () => {
          records.set(value.id, value);
          return value;
        },
        options.putError
      )
    ),
    get: vi.fn((id: string) => createRequest(() => records.get(id), options.getError)),
    delete: vi.fn((id: string) =>
      createRequest(
        () => {
          records.delete(id);
        },
        options.deleteError
      )
    ),
  };

  const db = {
    objectStoreNames: {
      contains: vi.fn(() => options.containsStore ?? false),
    },
    createObjectStore: vi.fn(),
    transaction: vi.fn(() => ({
      objectStore: () => store,
    })),
  };

  const open = vi.fn(() => {
    const request: {
      result?: unknown;
      error?: unknown;
      onerror: null | (() => void);
      onsuccess: null | (() => void);
      onupgradeneeded: null | ((event: { target: { result: unknown } }) => void);
    } = {
      result: db,
      onerror: null,
      onsuccess: null,
      onupgradeneeded: null,
    };

    queueMicrotask(() => {
      if (options.openError) {
        request.error = options.openError;
        request.onerror?.();
        return;
      }
      request.onupgradeneeded?.({ target: { result: db } });
      request.onsuccess?.();
    });

    return request;
  });

  Object.defineProperty(globalThis, 'indexedDB', {
    configurable: true,
    value: { open },
  });

  return { open, store, db };
}

async function loadHook() {
  const mod = await import('./useQuotePayloadStore');
  return mod.useQuotePayloadStore;
}

describe('useQuotePayloadStore', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    createIndexedDbMock();
  });

  it('saves and reads payload overrides', async () => {
    const useQuotePayloadStore = await loadHook();
    const { result } = renderHook(() => useQuotePayloadStore());

    await result.current.savePayloadConfig({ VehicleYear: 2024, VehiclePrice: 120000000 });
    const stored = await result.current.getPayloadConfig();

    expect(stored).toEqual({ VehicleYear: 2024, VehiclePrice: 120000000 });
  });

  it('clears stored payload overrides', async () => {
    const useQuotePayloadStore = await loadHook();
    const { result } = renderHook(() => useQuotePayloadStore());

    await result.current.savePayloadConfig({ VehicleUseCode: 2 });
    await result.current.clearPayloadConfig();
    const stored = await result.current.getPayloadConfig();

    expect(stored).toBeNull();
  });

  it('does not create the object store if it already exists', async () => {
    const { db } = createIndexedDbMock({ containsStore: true });
    const useQuotePayloadStore = await loadHook();
    const { result } = renderHook(() => useQuotePayloadStore());

    await result.current.getPayloadConfig();

    expect(db.createObjectStore).not.toHaveBeenCalled();
  });

  it('rejects when indexedDB open fails', async () => {
    createIndexedDbMock({ openError: new Error('open failed') });
    const useQuotePayloadStore = await loadHook();
    const { result } = renderHook(() => useQuotePayloadStore());

    await expect(result.current.getPayloadConfig()).rejects.toThrow('open failed');
  });

  it('rejects when put request fails', async () => {
    createIndexedDbMock({ putError: new Error('put failed') });
    const useQuotePayloadStore = await loadHook();
    const { result } = renderHook(() => useQuotePayloadStore());

    await expect(result.current.savePayloadConfig({ VehicleYear: 2023 })).rejects.toThrow('put failed');
  });

  it('rejects when get request fails', async () => {
    createIndexedDbMock({ getError: new Error('get failed') });
    const useQuotePayloadStore = await loadHook();
    const { result } = renderHook(() => useQuotePayloadStore());

    await expect(result.current.getPayloadConfig()).rejects.toThrow('get failed');
  });

  it('rejects when delete request fails', async () => {
    createIndexedDbMock({ deleteError: new Error('delete failed') });
    const useQuotePayloadStore = await loadHook();
    const { result } = renderHook(() => useQuotePayloadStore());

    await expect(result.current.clearPayloadConfig()).rejects.toThrow('delete failed');
  });
});
