'use client';

import { useState, useSyncExternalStore } from 'react';
import { AppLocale, normalizeLocale } from '@/lib/i18n';
import { LEGACY_LOCALE_STORAGE_KEYS, LOCALE_STORAGE_KEY } from '@/components/chat/chat-constants';
import { getCompatStorageItem, setCompatStorageItem } from '@/lib/browser-storage';

function resolveInitialLocale(defaultLocale: AppLocale): AppLocale {
  if (typeof window === 'undefined') {
    return defaultLocale;
  }

  const storedLocale = getCompatStorageItem(
    localStorage,
    LOCALE_STORAGE_KEY,
    LEGACY_LOCALE_STORAGE_KEYS
  );

  return storedLocale ? normalizeLocale(storedLocale) : defaultLocale;
}

export function useAppLocale(defaultLocale: AppLocale = 'es') {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const [locale, setLocale] = useState<AppLocale>(() => resolveInitialLocale(defaultLocale));

  const changeLocale = (nextLocale: AppLocale) => {
    setLocale(nextLocale);
    setCompatStorageItem(localStorage, LOCALE_STORAGE_KEY, nextLocale, LEGACY_LOCALE_STORAGE_KEYS);
    document.cookie = `app_locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
  };

  return { locale: mounted ? locale : defaultLocale, changeLocale };
}
