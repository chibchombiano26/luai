import { z } from 'zod';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { FLOW_CARD_DEFINITIONS, FlowCardId, isFlowCardId } from '@/lib/platform/cards';
import { getResolvedFlowCards, saveFlowCardSettings, type FlowCardWithStatus } from '@/lib/platform/settings';
import { isClerkAuthEnabled } from '@/lib/auth';
import { isAdminRole, resolveAppUserRoleFromMetadata } from '@/lib/access/roles';
import {
  isValidCardSystemPromptByLocale,
  resolveCardSystemPromptByLocale,
} from '@/lib/platform/card-system-prompts';
import {
  getProfileUiSettings,
  sanitizeProfileUiSettings,
  saveProfileUiSettings,
} from '@/lib/profile/ui-settings';
import {
  getAssistantAvatarPreset,
  sanitizeAssistantAvatarPreset,
  saveAssistantAvatarPreset,
} from '@/lib/profile/avatar-settings';
import { ASSISTANT_AVATAR_PRESET_VALUES } from '@/lib/profile/avatar-config';
import { getSecurityHeaders } from '@/lib/security';

const UpdateCardsSchema = z.object({
  enabledByCardId: z.record(z.boolean()).optional(),
  configByCardId: z.record(z.record(z.unknown())).optional(),
  profileUiSettings: z
    .object({
      showUsageSummary: z.boolean(),
      showDailyUsageChart: z.boolean(),
      showRecentTokenEvents: z.boolean(),
    })
    .optional(),
  assistantAvatarPreset: z.enum(ASSISTANT_AVATAR_PRESET_VALUES).optional(),
});

function responseJson(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getSecurityHeaders(),
    },
  });
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return result === 0;
}

function isBasicAuthConfigured(): boolean {
  if (isClerkAuthEnabled()) {
    return false;
  }

  if (process.env.BASIC_AUTH_ENABLED === 'false') {
    return false;
  }

  return Boolean(
    process.env.BASIC_AUTH_USERNAME?.trim() &&
      process.env.BASIC_AUTH_PASSWORD?.trim()
  );
}

function isBasicAuthRequestAuthenticated(request: Request): boolean {
  if (!isBasicAuthConfigured()) {
    return false;
  }

  const header = request.headers.get('authorization');
  if (!header || !header.startsWith('Basic ')) {
    return false;
  }

  try {
    const encoded = header.slice(6);
    const decoded =
      typeof atob === 'function'
        ? atob(encoded)
        : Buffer.from(encoded, 'base64').toString('utf-8');
    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex === -1) {
      return false;
    }

    const requestUsername = decoded.slice(0, separatorIndex);
    const requestPassword = decoded.slice(separatorIndex + 1);
    const expectedUsername = process.env.BASIC_AUTH_USERNAME?.trim() ?? '';
    const expectedPassword = process.env.BASIC_AUTH_PASSWORD?.trim() ?? '';

    return (
      constantTimeEqual(requestUsername, expectedUsername) &&
      constantTimeEqual(requestPassword, expectedPassword)
    );
  } catch {
    return false;
  }
}

function isNoAuthDevelopmentMode(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.CLERK_AUTH_ENABLED === 'false' &&
    process.env.BASIC_AUTH_ENABLED === 'false'
  );
}

async function ensureCardsManagementAccess(request: Request): Promise<Response | null> {
  if (isClerkAuthEnabled()) {
    const authState = await auth();
    if (!authState.userId) {
      return responseJson({ error: 'Authentication required' }, 401);
    }

    const client = await clerkClient();
    const actorUser = await client.users.getUser(authState.userId);
    const actorRole = resolveAppUserRoleFromMetadata(actorUser.publicMetadata);
    if (!isAdminRole(actorRole)) {
      return responseJson({ error: 'Admin privileges required' }, 403);
    }

    return null;
  }

  if (isBasicAuthRequestAuthenticated(request)) {
    return null;
  }

  if (isBasicAuthConfigured()) {
    return responseJson({ error: 'Authentication required' }, 401);
  }

  if (isNoAuthDevelopmentMode()) {
    return null;
  }

  return responseJson(
    { error: 'Authentication must be configured to manage platform cards' },
    503
  );
}

function sanitizeCardForPublic(card: FlowCardWithStatus): FlowCardWithStatus {
  const config = card.config;
  const safeConfig =
    config && typeof config === 'object' && !Array.isArray(config)
      ? {
          ...(Array.isArray(config.enabledCommands) ? { enabledCommands: config.enabledCommands } : {}),
        }
      : {};

  return {
    ...card,
    config: safeConfig,
  };
}

export async function GET(req: Request) {
  try {
    const requestUrl = new URL(req.url);
    const includeConfig = requestUrl.searchParams.get('includeConfig') === '1';

    if (includeConfig) {
      const authError = await ensureCardsManagementAccess(req);
      if (authError) {
        return authError;
      }
    }

    const [cards, profileUiSettings, assistantAvatarPreset] = await Promise.all([
      getResolvedFlowCards(),
      getProfileUiSettings(),
      getAssistantAvatarPreset(),
    ]);
    return responseJson({
      profileUiSettings,
      assistantAvatarPreset,
      cards: includeConfig ? cards : cards.map(sanitizeCardForPublic),
    });
  } catch (error) {
    console.error('Platform cards GET error:', error);
    return responseJson({ error: 'Failed to load platform cards' }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const authError = await ensureCardsManagementAccess(req);
    if (authError) {
      return authError;
    }

    const body = await req.json();
    const parsed = UpdateCardsSchema.safeParse(body);
    if (!parsed.success) {
      return responseJson(
        {
          error: 'Invalid cards payload',
          details: parsed.error.flatten(),
        },
        400
      );
    }

    const enabledByCardId: Partial<Record<FlowCardId, boolean>> = {};
    const configByCardId: Partial<Record<FlowCardId, Record<string, unknown>>> = {};

    const incomingEnabled = parsed.data.enabledByCardId ?? {};
    const incomingConfig = parsed.data.configByCardId ?? {};

    for (const card of FLOW_CARD_DEFINITIONS) {
      const enabledValue = incomingEnabled[card.id];
      if (typeof enabledValue === 'boolean') {
        enabledByCardId[card.id] = enabledValue;
      }

      const configValue = incomingConfig[card.id];
      if (configValue && typeof configValue === 'object' && !Array.isArray(configValue)) {
        configByCardId[card.id] = configValue;
      }
    }

    for (const key of Object.keys(incomingEnabled)) {
      if (!isFlowCardId(key)) continue;
      const value = incomingEnabled[key];
      if (typeof value === 'boolean') {
        enabledByCardId[key] = value;
      }
    }

    for (const key of Object.keys(incomingConfig)) {
      if (!isFlowCardId(key)) continue;
      const value = incomingConfig[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        configByCardId[key] = value;
      }
    }

    for (const card of FLOW_CARD_DEFINITIONS) {
      const cardConfig = configByCardId[card.id];
      if (!cardConfig || typeof cardConfig !== 'object') {
        return responseJson(
          {
            error: 'Missing required card system prompt',
            cardId: card.id,
          },
          400
        );
      }

      if (!isValidCardSystemPromptByLocale(cardConfig.systemPromptByLocale)) {
        cardConfig.systemPromptByLocale = resolveCardSystemPromptByLocale(card.id, cardConfig);
      }
    }

    const nextProfileUiSettings = sanitizeProfileUiSettings(
      parsed.data.profileUiSettings ?? (await getProfileUiSettings())
    );
    const nextAssistantAvatarPreset = sanitizeAssistantAvatarPreset(
      parsed.data.assistantAvatarPreset ?? (await getAssistantAvatarPreset())
    );
    const [settings, profileUiSettings, assistantAvatarPreset] = await Promise.all([
      saveFlowCardSettings({ enabledByCardId, configByCardId }),
      saveProfileUiSettings(nextProfileUiSettings),
      saveAssistantAvatarPreset(nextAssistantAvatarPreset),
    ]);
    return responseJson({ success: true, settings, profileUiSettings, assistantAvatarPreset });
  } catch (error) {
    console.error('Platform cards POST error:', error);
    return responseJson({ error: 'Failed to save platform cards' }, 500);
  }
}
