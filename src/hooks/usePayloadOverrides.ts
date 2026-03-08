'use client';

import { useCallback } from 'react';
import { isJsonObject, JsonObject } from '@/lib/types/json';
import {
  getCompatStorageItem,
  hasCompatStorageKey,
  removeCompatStorageItem,
  setCompatStorageItem,
} from '@/lib/browser-storage';
import {
  LEGACY_PAYLOAD_OVERRIDES_STORAGE_KEYS as LEGACY_PAYLOAD_OVERRIDES_STORAGE_KEYS_COMPAT,
} from '@/lib/legacy-compat';

export const PAYLOAD_OVERRIDES_STORAGE_KEY = 'luai_payload_overrides';
export const LEGACY_PAYLOAD_OVERRIDES_STORAGE_KEYS =
  LEGACY_PAYLOAD_OVERRIDES_STORAGE_KEYS_COMPAT;

function getSafeLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function mergeDeep(target: JsonObject, source: JsonObject): JsonObject {
  const output: JsonObject = { ...target };

  for (const [key, sourceValue] of Object.entries(source)) {
    const targetValue = output[key];

    if (isJsonObject(targetValue) && isJsonObject(sourceValue)) {
      output[key] = mergeDeep(targetValue, sourceValue);
      continue;
    }

    output[key] = sourceValue;
  }

  return output;
}

function parseJsonObject(raw: string): JsonObject | null {
  const parsed: unknown = JSON.parse(raw);
  return isJsonObject(parsed) ? parsed : null;
}

/**
 * Loads and applies persisted payload overrides for quote requests.
 * Overrides are read from localStorage and merged into outgoing arguments.
 */
export const usePayloadOverrides = () => {
  const applyOverrides = useCallback((args: JsonObject) => {
    try {
      const storage = getSafeLocalStorage();
      if (
        !storage ||
        !hasCompatStorageKey(
          storage,
          PAYLOAD_OVERRIDES_STORAGE_KEY,
          LEGACY_PAYLOAD_OVERRIDES_STORAGE_KEYS
        )
      ) {
        return args;
      }

      const stored = getCompatStorageItem(
        storage,
        PAYLOAD_OVERRIDES_STORAGE_KEY,
        LEGACY_PAYLOAD_OVERRIDES_STORAGE_KEYS
      );
      if (!stored) return args;

      const overrides = parseJsonObject(stored);
      if (!overrides) return args;

      const merged = mergeDeep(args, overrides);
      console.log('[PayloadOverrides] Applied overrides:', overrides);
      console.log('[PayloadOverrides] Final payload:', merged);
      return merged;
    } catch (err) {
      console.error('[PayloadOverrides] Failed to apply overrides:', err);
      return args;
    }
  }, []);

  const getOverrides = useCallback((): JsonObject | null => {
    try {
      const storage = getSafeLocalStorage();
      if (
        !storage ||
        !hasCompatStorageKey(
          storage,
          PAYLOAD_OVERRIDES_STORAGE_KEY,
          LEGACY_PAYLOAD_OVERRIDES_STORAGE_KEYS
        )
      ) {
        return null;
      }

      const stored = getCompatStorageItem(
        storage,
        PAYLOAD_OVERRIDES_STORAGE_KEY,
        LEGACY_PAYLOAD_OVERRIDES_STORAGE_KEYS
      );
      return stored ? parseJsonObject(stored) : null;
    } catch (err) {
      console.error('[PayloadOverrides] Failed to load overrides:', err);
      return null;
    }
  }, []);

  const saveOverrides = useCallback((overrides: JsonObject) => {
    const storage = getSafeLocalStorage();
    if (!storage) return;

    setCompatStorageItem(
      storage,
      PAYLOAD_OVERRIDES_STORAGE_KEY,
      JSON.stringify(overrides),
      LEGACY_PAYLOAD_OVERRIDES_STORAGE_KEYS
    );
  }, []);

  const clearOverrides = useCallback(() => {
    const storage = getSafeLocalStorage();
    if (!storage) return;

    removeCompatStorageItem(
      storage,
      PAYLOAD_OVERRIDES_STORAGE_KEY,
      LEGACY_PAYLOAD_OVERRIDES_STORAGE_KEYS
    );
  }, []);

  return { applyOverrides, getOverrides, saveOverrides, clearOverrides };
};
