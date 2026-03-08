'use client';

import { AppLocale } from '@/lib/i18n';
import { useAppLocale } from '@/hooks/useAppLocale';

export function useAdminLocale(defaultLocale: AppLocale = 'es') {
  return useAppLocale(defaultLocale);
}
