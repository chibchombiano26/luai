'use client';

import { useCallback, useEffect, useState } from 'react';
import { Save, RefreshCw, ChevronDown } from 'lucide-react';
import { AppLocale, normalizeLocale } from '@/lib/i18n';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSideNav } from '@/components/admin/AdminSideNav';
import { AvatarBadge } from '@/components/avatar/AvatarBadge';
import { LEGACY_LOCALE_STORAGE_KEYS, LOCALE_STORAGE_KEY } from '@/components/chat/chat-constants';
import { getCommandCatalogEntry, type ChatCommandId } from '@/lib/chat/commands';
import { isFlowCardId, type FlowCardId } from '@/lib/platform/cards';
import { getSlashCommandIdsForCard } from '@/lib/platform/slash-commands';
import {
  CARD_SYSTEM_PROMPT_MAX_LENGTH,
  resolveCardSystemPromptByLocale,
  type LocalizedCardSystemPrompt,
} from '@/lib/platform/card-system-prompts';
import {
  getToolPromptsByLocaleForCard,
  resolveToolPromptForLocale,
  getToolIdsForCard,
  TOOL_PROMPT_MAX_LENGTH,
  type FlowToolId,
  type LocalizedToolPrompt,
} from '@/lib/platform/tool-prompts';
import { getAdminCardConfigPlaceholder, getAdminProviderOptionsForCard } from '@/lib/platform/packs';
import { getCompatStorageItem, setCompatStorageItem } from '@/lib/browser-storage';
import {
  AI_MASCOT_AVATAR_ALT_PATH,
  AI_MASCOT_AVATAR_PATH,
  type AssistantAvatarPreset,
} from '@/lib/profile/avatar-config';

interface ConfigurableCard {
  id: string;
  category: string;
  name: {
    es: string;
    en: string;
  };
  description: {
    es: string;
    en: string;
  };
  defaultEnabled: boolean;
  enabled: boolean;
  toolId: string;
  langflowEndpoint?: string;
  config?: Record<string, unknown>;
}

interface ProfileUiSettings {
  showUsageSummary: boolean;
  showDailyUsageChart: boolean;
  showRecentTokenEvents: boolean;
}

const COPY: Record<
  AppLocale,
  {
    pageTitle: string;
    pageSubtitle: string;
    backToChat: string;
    loadError: string;
    saveError: string;
    success: string;
    loading: string;
    cardsTitle: string;
    cardsHint: string;
    cardsEmpty: string;
    reload: string;
    saveChanges: string;
    saving: string;
    enabledLabel: string;
    defaultLabel: string;
    endpointLabel: string;
    toolLabel: string;
    cardJsonConfig: string;
    invalidCardJson: string;
    commandSectionTitle: string;
    commandSectionHint: string;
    commandEmpty: string;
    systemPromptSectionTitle: string;
    systemPromptSectionHint: string;
    systemPromptRequired: string;
    systemPromptTooLong: string;
    toolPromptSectionTitle: string;
    toolPromptSectionHint: string;
    toolPromptEmpty: string;
    toolPromptTooLong: string;
    providerSectionTitle: string;
    providerSectionHint: string;
    providerSectionEmpty: string;
    profileSectionTitle: string;
    profileSectionHint: string;
    profileUsageSummary: string;
    profileDailyUsage: string;
    profileRecentEvents: string;
    assistantAvatarSectionTitle: string;
    assistantAvatarSectionHint: string;
    assistantAvatarDefault: string;
    assistantAvatarDefaultHint: string;
    assistantAvatarMascot: string;
    assistantAvatarMascotHint: string;
    assistantAvatarMascotAlt: string;
    assistantAvatarMascotAltHint: string;
  }
> = {
  es: {
    pageTitle: 'Configuración de Cards',
    pageSubtitle: 'Activa flujos y configura JSON por card',
    backToChat: 'Volver al chat',
    loadError: 'Error al cargar configuración',
    saveError: 'Error al guardar configuración',
    success: 'Configuración guardada ✓',
    loading: 'Cargando configuración...',
    cardsTitle: 'Cards disponibles',
    cardsHint: 'Cada card tiene su propio toggle y su propio JSON de configuración.',
    cardsEmpty: 'No hay cards configurados.',
    reload: 'Recargar',
    saveChanges: 'Guardar Cambios',
    saving: 'Guardando...',
    enabledLabel: 'Activo',
    defaultLabel: 'Por defecto',
    endpointLabel: 'Endpoint',
    toolLabel: 'Tool',
    cardJsonConfig: 'Configuración JSON del card',
    invalidCardJson: 'JSON inválido para el card',
    commandSectionTitle: 'Comandos slash del card',
    commandSectionHint: 'Activa o desactiva comandos asociados a este card.',
    commandEmpty: 'Este card no tiene comandos slash asociados.',
    systemPromptSectionTitle: 'System prompt del card',
    systemPromptSectionHint:
      'Obligatorio por widget. Se usa para orquestar el flujo cuando el card está activo (multiidioma, requiere ES/EN).',
    systemPromptRequired: 'El system prompt del card es obligatorio',
    systemPromptTooLong: `El system prompt excede ${CARD_SYSTEM_PROMPT_MAX_LENGTH} caracteres`,
    toolPromptSectionTitle: 'Prompts por herramienta',
    toolPromptSectionHint:
      'Configura instrucciones cortas por herramienta. Se agregan al prompt del sistema solo para cards activos.',
    toolPromptEmpty: 'Este card no tiene herramientas configurables para prompt.',
    toolPromptTooLong: `El prompt de herramienta excede ${TOOL_PROMPT_MAX_LENGTH} caracteres`,
    providerSectionTitle: 'Endpoints del card',
    providerSectionHint: 'Activa o desactiva endpoints de aseguradora para este flujo.',
    providerSectionEmpty: 'Este card no tiene endpoints configurables.',
    profileSectionTitle: 'Widgets core del perfil',
    profileSectionHint: 'Controla qué bloques nativos del perfil se muestran a todos los usuarios.',
    profileUsageSummary: 'Resumen de tokens',
    profileDailyUsage: 'Grafico de uso diario',
    profileRecentEvents: 'Ultimos eventos de tokens',
    assistantAvatarSectionTitle: 'Avatar global de la AI',
    assistantAvatarSectionHint:
      'Este avatar se usa para todos los usuarios cuando la AI responde, salvo que el usuario cargue uno propio.',
    assistantAvatarDefault: 'Icono por defecto',
    assistantAvatarDefaultHint: 'Usa el icono bot nativo del chat.',
    assistantAvatarMascot: 'Avatar personalizado',
    assistantAvatarMascotHint: 'Usa la imagen nueva ubicada en /public/avatar/Avatar.png.',
    assistantAvatarMascotAlt: 'Avatar personalizado 2',
    assistantAvatarMascotAltHint: 'Usa la imagen adicional ubicada en /public/avatar/Avatar_2.png.',
  },
  en: {
    pageTitle: 'Card Configuration',
    pageSubtitle: 'Enable flows and configure JSON per card',
    backToChat: 'Back to chat',
    loadError: 'Error loading configuration',
    saveError: 'Error saving configuration',
    success: 'Configuration saved ✓',
    loading: 'Loading configuration...',
    cardsTitle: 'Available cards',
    cardsHint: 'Each card has its own toggle and card-level JSON configuration.',
    cardsEmpty: 'No cards configured.',
    reload: 'Reload',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    enabledLabel: 'Enabled',
    defaultLabel: 'Default',
    endpointLabel: 'Endpoint',
    toolLabel: 'Tool',
    cardJsonConfig: 'Card JSON configuration',
    invalidCardJson: 'Invalid JSON for card',
    commandSectionTitle: 'Card slash commands',
    commandSectionHint: 'Enable or disable slash commands linked to this card.',
    commandEmpty: 'This card has no associated slash commands.',
    systemPromptSectionTitle: 'Card system prompt',
    systemPromptSectionHint:
      'Required per widget. Used to orchestrate active flow behavior (multilingual, requires ES/EN).',
    systemPromptRequired: 'Card system prompt is required',
    systemPromptTooLong: `System prompt exceeds ${CARD_SYSTEM_PROMPT_MAX_LENGTH} characters`,
    toolPromptSectionTitle: 'Tool prompts',
    toolPromptSectionHint:
      'Configure short instructions per tool. They are added to the system prompt only for active cards.',
    toolPromptEmpty: 'This card has no prompt-configurable tools.',
    toolPromptTooLong: `Tool prompt exceeds ${TOOL_PROMPT_MAX_LENGTH} characters`,
    providerSectionTitle: 'Card endpoints',
    providerSectionHint: 'Enable or disable insurer endpoints for this flow.',
    providerSectionEmpty: 'This card has no configurable endpoints.',
    profileSectionTitle: 'Core profile widgets',
    profileSectionHint: 'Control which native profile blocks are visible to all users.',
    profileUsageSummary: 'Token summary',
    profileDailyUsage: 'Daily usage chart',
    profileRecentEvents: 'Recent token events',
    assistantAvatarSectionTitle: 'Global AI avatar',
    assistantAvatarSectionHint:
      'This avatar is used for every user when the AI replies, unless the user uploads a personal override.',
    assistantAvatarDefault: 'Default icon',
    assistantAvatarDefaultHint: 'Use the built-in bot icon.',
    assistantAvatarMascot: 'Custom avatar',
    assistantAvatarMascotHint: 'Use the new image from /public/avatar/Avatar.png.',
    assistantAvatarMascotAlt: 'Custom avatar 2',
    assistantAvatarMascotAltHint: 'Use the additional image from /public/avatar/Avatar_2.png.',
  },
};

const DEFAULT_PROFILE_UI_SETTINGS: ProfileUiSettings = {
  showUsageSummary: true,
  showDailyUsageChart: true,
  showRecentTokenEvents: true,
};

function toCardConfigWithoutCommandOverrides(
  config: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!config) return {};
  const normalized = { ...config };
  delete normalized.enabledCommands;
  delete normalized.enabledProviders;
  delete normalized.toolPrompts;
  delete normalized.systemPrompt;
  delete normalized.systemPromptByLocale;
  return normalized;
}

function resolveProviderTogglesForCard(
  cardId: string,
  config: Record<string, unknown> | undefined
): Partial<Record<string, boolean>> {
  const providerOptions = getAdminProviderOptionsForCard(cardId);
  if (providerOptions.length === 0) return {};

  const defaultToggles = providerOptions.reduce<Record<string, boolean>>((acc, provider) => {
      const providerCode = provider.id;
      acc[providerCode] = true;
      return acc;
    },
    {}
  );

  const rawEnabledProviders = config?.enabledProviders;
  if (!Array.isArray(rawEnabledProviders)) {
    return defaultToggles;
  }

  const enabledSet = new Set(
    rawEnabledProviders
      .filter((value): value is string => typeof value === 'string')
      .filter((value) => providerOptions.some((provider) => provider.id === value))
  );

  return providerOptions.reduce<Record<string, boolean>>((acc, provider) => {
      const providerCode = provider.id;
      acc[providerCode] = enabledSet.has(providerCode);
      return acc;
    },
    {}
  );
}

function resolveCommandTogglesForCard(
  cardId: string,
  config: Record<string, unknown> | undefined
): Partial<Record<ChatCommandId, boolean>> {
  if (!isFlowCardId(cardId)) return {};
  const availableCommands = getSlashCommandIdsForCard(cardId);
  const commandToggles = availableCommands.reduce<Record<ChatCommandId, boolean>>((acc, commandId) => {
    acc[commandId] = true;
    return acc;
  }, {} as Record<ChatCommandId, boolean>);

  const rawEnabledCommands = config?.enabledCommands;
  if (!Array.isArray(rawEnabledCommands)) {
    return commandToggles;
  }

  const enabledSet = new Set(
    rawEnabledCommands
      .filter((value): value is ChatCommandId => typeof value === 'string')
      .filter((value): value is ChatCommandId => availableCommands.includes(value as ChatCommandId))
  );

  return availableCommands.reduce<Record<ChatCommandId, boolean>>((acc, commandId) => {
    acc[commandId] = enabledSet.has(commandId);
    return acc;
  }, {} as Record<ChatCommandId, boolean>);
}

function resolveToolPromptsForCard(
  cardId: string,
  config: Record<string, unknown> | undefined
): Partial<Record<FlowToolId, LocalizedToolPrompt>> {
  if (!isFlowCardId(cardId)) return {};
  return getToolPromptsByLocaleForCard(cardId, config);
}

function resolveSystemPromptByCard(
  cardId: string,
  config: Record<string, unknown> | undefined
): LocalizedCardSystemPrompt {
  if (!isFlowCardId(cardId)) {
    return { es: '', en: '' };
  }

  return resolveCardSystemPromptByLocale(cardId, config);
}

export default function AdminPage() {
  const [locale, setLocale] = useState<AppLocale>('es');
  const [cards, setCards] = useState<ConfigurableCard[]>([]);
  const [cardJsonById, setCardJsonById] = useState<Record<string, string>>({});
  const [enabledCommandsByCardId, setEnabledCommandsByCardId] = useState<
    Record<string, Partial<Record<ChatCommandId, boolean>>>
  >({});
  const [enabledProvidersByCardId, setEnabledProvidersByCardId] = useState<
    Record<string, Partial<Record<string, boolean>>>
  >({});
  const [systemPromptByCardId, setSystemPromptByCardId] = useState<
    Record<string, LocalizedCardSystemPrompt>
  >({});
  const [toolPromptsByCardId, setToolPromptsByCardId] = useState<
    Record<string, Partial<Record<FlowToolId, LocalizedToolPrompt>>>
  >({});
  const [expandedCardById, setExpandedCardById] = useState<Record<string, boolean>>({});
  const [profileUiSettings, setProfileUiSettings] = useState<ProfileUiSettings>(
    DEFAULT_PROFILE_UI_SETTINGS
  );
  const [assistantAvatarPreset, setAssistantAvatarPreset] =
    useState<AssistantAvatarPreset>('default');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const t = COPY[locale];

  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/platform/cards?includeConfig=1');
      if (!response.ok) {
        throw new Error('Failed to load cards configuration');
      }

      const data = (await response.json()) as {
        cards?: ConfigurableCard[];
        profileUiSettings?: ProfileUiSettings;
        assistantAvatarPreset?: AssistantAvatarPreset;
      };
      const loadedCards = Array.isArray(data.cards) ? data.cards : [];
      setProfileUiSettings({
        ...DEFAULT_PROFILE_UI_SETTINGS,
        ...(data.profileUiSettings ?? {}),
      });
      setAssistantAvatarPreset(data.assistantAvatarPreset ?? 'default');
      setCards(loadedCards);
      setCardJsonById(
        loadedCards.reduce<Record<string, string>>((acc, card) => {
          const config = toCardConfigWithoutCommandOverrides(card.config);
          const isEmptyConfig = Object.keys(config).length === 0;
          acc[card.id] = isEmptyConfig ? '' : JSON.stringify(config, null, 2);
          return acc;
        }, {})
      );
      setEnabledCommandsByCardId(
        loadedCards.reduce<Record<string, Partial<Record<ChatCommandId, boolean>>>>((acc, card) => {
          acc[card.id] = resolveCommandTogglesForCard(card.id, card.config);
          return acc;
        }, {})
      );
      setEnabledProvidersByCardId(
        loadedCards.reduce<Record<string, Partial<Record<string, boolean>>>>((acc, card) => {
          acc[card.id] = resolveProviderTogglesForCard(card.id, card.config);
          return acc;
        }, {})
      );
      setToolPromptsByCardId(
        loadedCards.reduce<Record<string, Partial<Record<FlowToolId, LocalizedToolPrompt>>>>((acc, card) => {
          acc[card.id] = resolveToolPromptsForCard(card.id, card.config);
          return acc;
        }, {})
      );
      setSystemPromptByCardId(
        loadedCards.reduce<Record<string, LocalizedCardSystemPrompt>>((acc, card) => {
          acc[card.id] = resolveSystemPromptByCard(card.id, card.config);
          return acc;
        }, {})
      );
      setExpandedCardById(
        loadedCards.reduce<Record<string, boolean>>((acc, card) => {
          acc[card.id] = false;
          return acc;
        }, {})
      );
    } catch (err) {
      setError(t.loadError);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [t.loadError]);

  useEffect(() => {
    const storedLocale = getCompatStorageItem(
      localStorage,
      LOCALE_STORAGE_KEY,
      LEGACY_LOCALE_STORAGE_KEYS
    );
    if (storedLocale) {
      setLocale(normalizeLocale(storedLocale));
    }
    loadConfig();
  }, [loadConfig]);

  const changeLocale = (nextLocale: AppLocale) => {
    setLocale(nextLocale);
    setCompatStorageItem(localStorage, LOCALE_STORAGE_KEY, nextLocale, LEGACY_LOCALE_STORAGE_KEYS);
    document.cookie = `app_locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
  };

  const handleToggleCard = (cardId: string, enabled: boolean) => {
    setCards((previous) =>
      previous.map((card) =>
        card.id === cardId
          ? {
              ...card,
              enabled,
            }
          : card
      )
    );
  };

  const handleCardJsonChange = (cardId: string, value: string) => {
    setCardJsonById((previous) => ({
      ...previous,
      [cardId]: value,
    }));
  };

  const handleToggleCardCommand = (cardId: string, commandId: ChatCommandId, enabled: boolean) => {
    setEnabledCommandsByCardId((previous) => ({
      ...previous,
      [cardId]: {
        ...(previous[cardId] ?? {}),
        [commandId]: enabled,
      },
    }));
  };

  const handleToggleCardProvider = (
    cardId: string,
    providerCode: string,
    enabled: boolean
  ) => {
    setEnabledProvidersByCardId((previous) => ({
      ...previous,
      [cardId]: {
        ...(previous[cardId] ?? {}),
        [providerCode]: enabled,
      },
    }));
  };

  const handleToolPromptChange = (
    cardId: string,
    toolId: FlowToolId,
    nextLocale: AppLocale,
    value: string
  ) => {
    setToolPromptsByCardId((previous) => ({
      ...previous,
      [cardId]: {
        ...(previous[cardId] ?? {}),
        [toolId]: {
          ...(previous[cardId]?.[toolId] ?? {}),
          [nextLocale]: value,
        },
      },
    }));
  };

  const handleSystemPromptChange = (cardId: string, nextLocale: AppLocale, value: string) => {
    setSystemPromptByCardId((previous) => ({
      ...previous,
      [cardId]: {
        ...(previous[cardId] ?? {}),
        [nextLocale]: value,
      },
    }));
  };

  const toggleCardExpanded = (cardId: string) => {
    setExpandedCardById((previous) => ({
      ...previous,
      [cardId]: !(previous[cardId] ?? false),
    }));
  };

  const handleToggleProfileWidget = (key: keyof ProfileUiSettings, enabled: boolean) => {
    setProfileUiSettings((previous) => ({
      ...previous,
      [key]: enabled,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const enabledByCardId = cards.reduce<Record<string, boolean>>((acc, card) => {
        acc[card.id] = card.enabled;
        return acc;
      }, {});

      const configByCardId = cards.reduce<Record<string, Record<string, unknown>>>((acc, card) => {
        const raw = cardJsonById[card.id] ?? '';
        const normalizedRaw = raw.trim();
        let nextConfig: Record<string, unknown> = {};

        if (normalizedRaw) {
          let parsed: unknown;
          try {
            parsed = JSON.parse(normalizedRaw);
          } catch {
            throw new Error(`${t.invalidCardJson}: ${card.name[locale]}`);
          }

          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new Error(`${t.invalidCardJson}: ${card.name[locale]}`);
          }

          nextConfig = { ...(parsed as Record<string, unknown>) };
        }
        if (isFlowCardId(card.id)) {
          const flowCardId = card.id as FlowCardId;
          const systemPrompt = systemPromptByCardId[card.id] ?? {};
          const normalizedSystemPromptEs =
            typeof systemPrompt.es === 'string' ? systemPrompt.es.trim() : '';
          const normalizedSystemPromptEn =
            typeof systemPrompt.en === 'string' ? systemPrompt.en.trim() : '';
          if (!normalizedSystemPromptEs || !normalizedSystemPromptEn) {
            throw new Error(`${t.systemPromptRequired}: ${card.name[locale]} (ES/EN)`);
          }
          if (
            normalizedSystemPromptEs.length > CARD_SYSTEM_PROMPT_MAX_LENGTH ||
            normalizedSystemPromptEn.length > CARD_SYSTEM_PROMPT_MAX_LENGTH
          ) {
            throw new Error(`${t.systemPromptTooLong}: ${card.name[locale]}`);
          }
          const sanitizedSystemPromptByLocale = Object.entries(systemPrompt).reduce<
            Record<string, string>
          >((acc, [localeKey, localePrompt]) => {
            if (typeof localePrompt !== 'string') return acc;
            const normalizedKey = localeKey.trim().toLowerCase();
            if (!normalizedKey) return acc;
            const normalizedPrompt = localePrompt.trim();
            if (!normalizedPrompt) return acc;
            if (normalizedPrompt.length > CARD_SYSTEM_PROMPT_MAX_LENGTH) {
              throw new Error(`${t.systemPromptTooLong}: ${card.name[locale]}`);
            }
            acc[normalizedKey] = normalizedPrompt;
            return acc;
          }, {});
          nextConfig.systemPromptByLocale = {
            ...sanitizedSystemPromptByLocale,
            es: normalizedSystemPromptEs,
            en: normalizedSystemPromptEn,
          };

          const availableCommands = getSlashCommandIdsForCard(flowCardId);
          const selectedCommands = card.enabled
            ? availableCommands.filter(
                (commandId) => enabledCommandsByCardId[card.id]?.[commandId] ?? true
              )
            : [];
          nextConfig.enabledCommands = selectedCommands;

          const availableToolIds = getToolIdsForCard(flowCardId);
          const selectedToolPrompts = availableToolIds.reduce<
            Partial<Record<FlowToolId, Record<string, string>>>
          >((acc, toolId) => {
            const rawPromptByLocale = toolPromptsByCardId[card.id]?.[toolId];
            if (!rawPromptByLocale || typeof rawPromptByLocale !== 'object') return acc;

            const normalizedPromptByLocale = Object.entries(rawPromptByLocale).reduce<
              Record<string, string>
            >((toolAcc, [localeKey, localePrompt]) => {
              if (typeof localePrompt !== 'string') return toolAcc;
              const normalizedKey = localeKey.trim().toLowerCase();
              if (!normalizedKey) return toolAcc;
              const normalizedPrompt = localePrompt.trim();
              if (!normalizedPrompt) return toolAcc;
              if (normalizedPrompt.length > TOOL_PROMPT_MAX_LENGTH) {
                throw new Error(`${t.toolPromptTooLong}: ${card.name[locale]} (${toolId})`);
              }
              toolAcc[normalizedKey] = normalizedPrompt;
              return toolAcc;
            }, {});

            if (Object.keys(normalizedPromptByLocale).length === 0) return acc;
            acc[toolId] = normalizedPromptByLocale;
            return acc;
          }, {});
          if (Object.keys(selectedToolPrompts).length > 0) {
            nextConfig.toolPrompts = selectedToolPrompts;
          }

          const providerOptions = getAdminProviderOptionsForCard(flowCardId);
          if (providerOptions.length > 0) {
            const selectedProviders = card.enabled
              ? providerOptions
                  .map((provider) => provider.id)
                  .filter((providerCode) => enabledProvidersByCardId[card.id]?.[providerCode] ?? true)
              : [];
            nextConfig.enabledProviders = selectedProviders;
          }
        }

        acc[card.id] = nextConfig;
        return acc;
      }, {});

      const response = await fetch('/api/platform/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabledByCardId,
          configByCardId,
          profileUiSettings,
          assistantAvatarPreset,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save cards configuration');
      }

      setSuccess(t.success);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.saveError);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <AdminPageHeader
        locale={locale}
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
        backLabel={t.backToChat}
        onChangeLocale={changeLocale}
      />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside>
            <AdminSideNav locale={locale} />
          </aside>

          <div>
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">⚠️ {error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-400">✓ {success}</p>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-zinc-600 dark:text-zinc-400">{t.loading}</div>
              </div>
            ) : (
              <div className="space-y-6">
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                  {t.assistantAvatarSectionTitle}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {t.assistantAvatarSectionHint}
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  {
                    id: 'default' as const,
                    title: t.assistantAvatarDefault,
                    hint: t.assistantAvatarDefaultHint,
                    imageUrl: null,
                  },
                  {
                    id: 'mascot' as const,
                    title: t.assistantAvatarMascot,
                    hint: t.assistantAvatarMascotHint,
                    imageUrl: AI_MASCOT_AVATAR_PATH,
                  },
                  {
                    id: 'mascot_alt' as const,
                    title: t.assistantAvatarMascotAlt,
                    hint: t.assistantAvatarMascotAltHint,
                    imageUrl: AI_MASCOT_AVATAR_ALT_PATH,
                  },
                ].map((option) => {
                  const selected = assistantAvatarPreset === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setAssistantAvatarPreset(option.id)}
                      className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                        selected
                          ? 'border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30'
                          : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/40 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <AvatarBadge role="assistant" imageUrl={option.imageUrl} size="lg" />
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {option.title}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{option.hint}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{t.profileSectionTitle}</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.profileSectionHint}</p>
              </div>
              <div className="space-y-2 rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
                {(
                  [
                    ['showUsageSummary', t.profileUsageSummary],
                    ['showDailyUsageChart', t.profileDailyUsage],
                    ['showRecentTokenEvents', t.profileRecentEvents],
                  ] as const
                ).map(([key, label]) => {
                  const enabled = profileUiSettings[key];
                  return (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <p className="text-sm text-zinc-800 dark:text-zinc-200">{label}</p>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        aria-label={label}
                        onClick={() => handleToggleProfileWidget(key, !enabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          enabled ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                            enabled ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{t.cardsTitle}</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.cardsHint}</p>
              </div>

              {cards.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.cardsEmpty}</p>
              ) : (
                <div className="space-y-4">
                  {cards.map((card) => (
                    <div
                      key={card.id}
                      className="flex flex-col gap-3 rounded-lg border border-zinc-200 dark:border-zinc-700 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {card.name[locale]}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {card.description[locale]}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={card.enabled}
                            aria-label={`${card.name[locale]} ${t.enabledLabel}`}
                            onClick={() => handleToggleCard(card.id, !card.enabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              card.enabled ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                                card.enabled ? 'translate-x-5' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleCardExpanded(card.id)}
                            aria-label={`${card.name[locale]} expand`}
                            className="h-8 w-8 rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center"
                          >
                            <ChevronDown
                              className={`w-4 h-4 transition-transform ${
                                expandedCardById[card.id] ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                      {expandedCardById[card.id] ? (
                        <>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1">
                            <p>
                              <span className="font-medium">{t.enabledLabel}:</span> {card.enabled ? 'true' : 'false'}
                            </p>
                            <p>
                              <span className="font-medium">{t.defaultLabel}:</span> {card.defaultEnabled ? 'true' : 'false'}
                            </p>
                            <p>
                              <span className="font-medium">{t.toolLabel}:</span> {card.toolId}
                            </p>
                            {card.langflowEndpoint ? (
                              <p>
                                <span className="font-medium">{t.endpointLabel}:</span> {card.langflowEndpoint}
                              </p>
                            ) : null}
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                              {t.providerSectionTitle}
                            </label>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {t.providerSectionHint}
                            </p>
                            {getAdminProviderOptionsForCard(card.id).length > 0 ? (
                              <div className="space-y-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/30 p-3">
                                {getAdminProviderOptionsForCard(card.id).map((provider) => {
                                  const providerCode = provider.id;
                                  const isProviderEnabled = card.enabled
                                    ? (enabledProvidersByCardId[card.id]?.[providerCode] ?? true)
                                    : false;

                                  return (
                                    <div
                                      key={`${card.id}-${providerCode}`}
                                      className="flex items-center justify-between gap-3"
                                    >
                                      <div>
                                        <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                                          {provider.label[locale]}
                                        </p>
                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                          {provider.endpointKey ? `/${provider.endpointKey}` : providerCode}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        role="switch"
                                        aria-checked={isProviderEnabled}
                                        aria-label={`${card.name[locale]} endpoint ${providerCode}`}
                                        data-testid={`provider-toggle-${card.id}-${providerCode}`}
                                        disabled={!card.enabled}
                                        onClick={() =>
                                          handleToggleCardProvider(card.id, providerCode, !isProviderEnabled)
                                        }
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                          isProviderEnabled
                                            ? 'bg-blue-600'
                                            : 'bg-zinc-300 dark:bg-zinc-700'
                                        } ${!card.enabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                                      >
                                        <span
                                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                                            isProviderEnabled ? 'translate-x-5' : 'translate-x-0.5'
                                          }`}
                                        />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                {t.providerSectionEmpty}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                              {t.systemPromptSectionTitle}
                            </label>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {t.systemPromptSectionHint}
                            </p>
                            {isFlowCardId(card.id) ? (
                              <div className="space-y-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/30 p-3">
                                <textarea
                                  value={systemPromptByCardId[card.id]?.[locale] ?? ''}
                                  maxLength={CARD_SYSTEM_PROMPT_MAX_LENGTH}
                                  onChange={(event) =>
                                    handleSystemPromptChange(card.id, locale, event.target.value)
                                  }
                                  data-testid={`system-prompt-${card.id}-${locale}`}
                                  placeholder={
                                    locale === 'en'
                                      ? 'Required system prompt for this widget.'
                                      : 'System prompt obligatorio para este widget.'
                                  }
                                  className="w-full h-28 p-3 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md text-xs dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                  {(systemPromptByCardId[card.id]?.[locale] ?? '').length}/
                                  {CARD_SYSTEM_PROMPT_MAX_LENGTH}
                                </p>
                              </div>
                            ) : null}
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                              {t.commandSectionTitle}
                            </label>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {t.commandSectionHint}
                            </p>
                            {isFlowCardId(card.id) && getSlashCommandIdsForCard(card.id).length > 0 ? (
                              <div className="space-y-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/30 p-3">
                                {getSlashCommandIdsForCard(card.id).map((commandId) => {
                                  const command = getCommandCatalogEntry(commandId, locale);
                                  const isCommandEnabled = card.enabled
                                    ? (enabledCommandsByCardId[card.id]?.[commandId] ?? true)
                                    : false;

                                  return (
                                    <div
                                      key={`${card.id}-${commandId}`}
                                      className="flex items-center justify-between gap-3"
                                    >
                                      <div>
                                        <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                                          {command.name}
                                        </p>
                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                          {command.example}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        role="switch"
                                        aria-checked={isCommandEnabled}
                                        aria-label={`${card.name[locale]} /${commandId}`}
                                        data-testid={`command-toggle-${card.id}-${commandId}`}
                                        disabled={!card.enabled}
                                        onClick={() =>
                                          handleToggleCardCommand(card.id, commandId, !isCommandEnabled)
                                        }
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                          isCommandEnabled
                                            ? 'bg-blue-600'
                                            : 'bg-zinc-300 dark:bg-zinc-700'
                                        } ${!card.enabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                                      >
                                        <span
                                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                                            isCommandEnabled ? 'translate-x-5' : 'translate-x-0.5'
                                          }`}
                                        />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                {t.commandEmpty}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                              {t.toolPromptSectionTitle}
                            </label>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {t.toolPromptSectionHint}
                            </p>
                            {isFlowCardId(card.id) && getToolIdsForCard(card.id).length > 0 ? (
                              <div className="space-y-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/30 p-3">
                                {getToolIdsForCard(card.id).map((toolId) => {
                                  const value =
                                    toolPromptsByCardId[card.id]?.[toolId]?.[locale] ??
                                    resolveToolPromptForLocale(toolPromptsByCardId[card.id]?.[toolId], locale) ??
                                    '';
                                  return (
                                    <div key={`${card.id}-${toolId}`} className="space-y-1">
                                      <label
                                        htmlFor={`${card.id}-${toolId}-prompt`}
                                        className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300"
                                      >
                                        {toolId}
                                      </label>
                                      <textarea
                                        id={`${card.id}-${toolId}-prompt`}
                                        data-testid={`tool-prompt-${card.id}-${toolId}`}
                                        value={value}
                                        maxLength={TOOL_PROMPT_MAX_LENGTH}
                                        onChange={(event) =>
                                          handleToolPromptChange(card.id, toolId, locale, event.target.value)
                                        }
                                        placeholder={
                                          locale === 'en'
                                            ? 'Optional short instruction for this tool.'
                                            : 'Instrucción corta opcional para esta herramienta.'
                                        }
                                        className="w-full h-20 p-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md text-xs dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                      />
                                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                        {value.length}/{TOOL_PROMPT_MAX_LENGTH}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                {t.toolPromptEmpty}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                              {t.cardJsonConfig}
                            </label>
                            <textarea
                              value={cardJsonById[card.id] ?? ''}
                              onChange={(event) => handleCardJsonChange(card.id, event.target.value)}
                              placeholder={getAdminCardConfigPlaceholder(card.id, locale) || '{}'}
                              className="w-full h-36 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg font-mono text-xs dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          <p>
                            <span className="font-medium">{t.enabledLabel}:</span> {card.enabled ? 'true' : 'false'} ·{' '}
                            <span className="font-medium">{t.toolLabel}:</span> {card.toolId}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={loadConfig}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                {t.reload}
              </button>

              <div className="flex-1" />

              <button
                onClick={handleSave}
                disabled={isSaving || isLoading}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? t.saving : t.saveChanges}
              </button>
            </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
