import { describe, expect, it } from 'vitest';
import {
  getCompatStorageItem,
  hasCompatStorageKey,
  removeCompatStorageItem,
  setCompatStorageItem,
} from './browser-storage';

function createStorageMock(initialEntries: Array<[string, string]> = []): Storage {
  const store = new Map<string, string>(initialEntries);

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key) ?? null : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  } as Storage;
}

describe('browser storage compatibility helpers', () => {
  it('returns the primary value when it exists', () => {
    const storage = createStorageMock([
      ['primary', 'current'],
      ['legacy', 'old'],
    ]);

    expect(getCompatStorageItem(storage, 'primary', ['legacy'])).toBe('current');
    expect(storage.getItem('legacy')).toBe('old');
  });

  it('migrates the first legacy value to the primary key', () => {
    const storage = createStorageMock([
      ['legacy', 'old'],
    ]);

    expect(getCompatStorageItem(storage, 'primary', ['legacy'])).toBe('old');
    expect(storage.getItem('primary')).toBe('old');
    expect(storage.getItem('legacy')).toBeNull();
  });

  it('returns null when neither primary nor legacy keys exist', () => {
    const storage = createStorageMock();
    expect(getCompatStorageItem(storage, 'primary', ['legacy'])).toBeNull();
  });

  it('detects primary and legacy keys while ignoring null key slots', () => {
    const storage = createStorageMock([
      ['legacy', 'value'],
    ]);

    expect(hasCompatStorageKey(storage, 'primary', ['legacy'])).toBe(true);
    expect(hasCompatStorageKey(storage, 'missing', ['other'])).toBe(false);
  });

  it('writes the primary key and removes only distinct legacy keys', () => {
    const storage = createStorageMock([
      ['legacy', 'value'],
      ['primary', 'older'],
    ]);

    setCompatStorageItem(storage, 'primary', 'next', ['legacy', 'primary']);

    expect(storage.getItem('primary')).toBe('next');
    expect(storage.getItem('legacy')).toBeNull();
  });

  it('removes the primary key and distinct legacy keys', () => {
    const storage = createStorageMock([
      ['legacy', 'value'],
      ['primary', 'value'],
    ]);

    removeCompatStorageItem(storage, 'primary', ['legacy', 'primary']);

    expect(storage.getItem('primary')).toBeNull();
    expect(storage.getItem('legacy')).toBeNull();
  });
});
