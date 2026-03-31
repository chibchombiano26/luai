'use client';

import type { ComponentType, ReactNode } from 'react';
import type { ChatToolMessage } from '@/lib/chatHistory';
import type { AppLocale } from '@/lib/i18n';
import type { ProfileSummary, UsageSummary } from '@/lib/profile/types';

export interface FlowPackToolRendererProps {
  toolMessage: ChatToolMessage;
  locale: AppLocale;
  onRemove: () => void;
  onFormSubmit: (text: string) => Promise<void>;
}

export interface FlowPackToolRendererRegistration {
  toolType: ChatToolMessage['type'] | string;
  cardId?: string;
  titleByLocale?: Partial<Record<AppLocale, string>>;
  Component: ComponentType<FlowPackToolRendererProps>;
}

export interface FlowPackHomeExperienceProps {
  cardId: string;
  clerkEnabled: boolean;
  locale?: AppLocale;
  chromeAccessory?: ReactNode;
  toolbarPortalTarget?: HTMLElement | null;
  onLocaleChange?: (locale: AppLocale) => void;
}

export interface FlowPackHomeExperienceRegistration {
  componentKey: string;
  Component: ComponentType<FlowPackHomeExperienceProps>;
}

export interface FlowPackAdminPageProps {
  locale: AppLocale;
}

export interface FlowPackAdminPageRegistration {
  id: string;
  slug: string;
  navLabelByLocale: Record<AppLocale, string>;
  titleByLocale: Record<AppLocale, string>;
  subtitleByLocale?: Partial<Record<AppLocale, string>>;
  iconKey?: string;
  order?: number;
  Component: ComponentType<FlowPackAdminPageProps>;
}

export interface FlowPackProfileWidgetProps {
  locale: AppLocale;
  profile: ProfileSummary;
  usage: UsageSummary;
}

export interface FlowPackProfileWidgetRegistration {
  id: string;
  titleByLocale?: Partial<Record<AppLocale, string>>;
  order?: number;
  Component: ComponentType<FlowPackProfileWidgetProps>;
}

export interface FlowPackUiModule {
  renderers?: readonly FlowPackToolRendererRegistration[];
  adminPages?: readonly FlowPackAdminPageRegistration[];
  profileWidgets?: readonly FlowPackProfileWidgetRegistration[];
  homeExperiences?: readonly FlowPackHomeExperienceRegistration[];
}

function compareByOrderThenId(
  a: { order?: number; id: string },
  b: { order?: number; id: string }
): number {
  return (a.order ?? 0) - (b.order ?? 0) || a.id.localeCompare(b.id);
}

export function getFlowPackAdminPageRegistrations(
  modules: Record<string, FlowPackUiModule>
): FlowPackAdminPageRegistration[] {
  return Object.values(modules)
    .flatMap((module) => module.adminPages ?? [])
    .slice()
    .sort(compareByOrderThenId);
}

export function resolveFlowPackAdminPage(
  registrations: readonly FlowPackAdminPageRegistration[],
  slug: string
): FlowPackAdminPageRegistration | null {
  return registrations.find((registration) => registration.slug === slug) ?? null;
}

export function getFlowPackProfileWidgetRegistrations(
  modules: Record<string, FlowPackUiModule>
): FlowPackProfileWidgetRegistration[] {
  return Object.values(modules)
    .flatMap((module) => module.profileWidgets ?? [])
    .slice()
    .sort(compareByOrderThenId);
}

export function getFlowPackHomeExperienceRegistrations(
  modules: Record<string, FlowPackUiModule>
): FlowPackHomeExperienceRegistration[] {
  return Object.values(modules)
    .flatMap((module) => module.homeExperiences ?? [])
    .slice()
    .sort((a, b) => a.componentKey.localeCompare(b.componentKey));
}

export function resolveFlowPackToolRenderer(
  registrations: readonly FlowPackToolRendererRegistration[],
  toolMessage: ChatToolMessage
): FlowPackToolRendererRegistration | null {
  const cardId =
    toolMessage.type === 'dynamic_card' && typeof toolMessage.data.cardId === 'string'
      ? toolMessage.data.cardId
      : null;

  if (cardId) {
    const exactMatch = registrations.find(
      (registration) =>
        registration.toolType === toolMessage.type && registration.cardId === cardId
    );
    if (exactMatch) return exactMatch;
  }

  const toolTypeMatch = registrations.find(
    (registration) =>
      registration.toolType === toolMessage.type && typeof registration.cardId === 'undefined'
  );

  return toolTypeMatch ?? null;
}

export function resolveFlowPackHomeExperience(
  registrations: readonly FlowPackHomeExperienceRegistration[],
  componentKey: string
): FlowPackHomeExperienceRegistration | null {
  return registrations.find((registration) => registration.componentKey === componentKey) ?? null;
}
