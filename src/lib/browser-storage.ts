export function getCompatStorageItem(
  storage: Storage,
  primaryKey: string,
  legacyKeys: readonly string[] = []
): string | null {
  const primaryValue = storage.getItem(primaryKey);
  if (primaryValue !== null) {
    return primaryValue;
  }

  for (const legacyKey of legacyKeys) {
    const legacyValue = storage.getItem(legacyKey);
    if (legacyValue !== null) {
      setCompatStorageItem(storage, primaryKey, legacyValue, legacyKeys);
      return legacyValue;
    }
  }

  return null;
}

export function hasCompatStorageKey(
  storage: Storage,
  primaryKey: string,
  legacyKeys: readonly string[] = []
): boolean {
  const acceptedKeys = new Set([primaryKey, ...legacyKeys]);

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && acceptedKeys.has(key)) {
      return true;
    }
  }

  return false;
}

export function setCompatStorageItem(
  storage: Storage,
  primaryKey: string,
  value: string,
  legacyKeys: readonly string[] = []
): void {
  storage.setItem(primaryKey, value);
  for (const legacyKey of legacyKeys) {
    if (legacyKey === primaryKey) continue;
    storage.removeItem(legacyKey);
  }
}

export function removeCompatStorageItem(
  storage: Storage,
  primaryKey: string,
  legacyKeys: readonly string[] = []
): void {
  storage.removeItem(primaryKey);
  for (const legacyKey of legacyKeys) {
    if (legacyKey === primaryKey) continue;
    storage.removeItem(legacyKey);
  }
}
