import type { AppLocale } from '@/lib/i18n';
import { getRepositories } from '@/lib/repositories/repository-factory';

/** Supported AI provider identifiers available to the admin configuration layer. */
export const AI_PROVIDER_IDS = ['gemini'] as const;

export type AiProviderId = (typeof AI_PROVIDER_IDS)[number];

export type AiProviderStatus = {
  id: AiProviderId;
  label: Record<AppLocale, string>;
  configured: boolean;
  hasStoredSecret: boolean;
  configuredVia: 'admin' | 'env' | null;
  updatedAt: string | null;
};

type AiProviderDefinition = {
  id: AiProviderId;
  label: Record<AppLocale, string>;
  envVarName: string;
};

const AI_PROVIDER_DEFINITIONS: readonly AiProviderDefinition[] = [
  {
    id: 'gemini',
    label: {
      es: 'Google Gemini',
      en: 'Google Gemini',
    },
    envVarName: 'GOOGLE_GENERATIVE_AI_API_KEY',
  },
] as const;

function getAiProviderDefinition(providerId: AiProviderId): AiProviderDefinition {
  const definition = AI_PROVIDER_DEFINITIONS.find((item) => item.id === providerId);
  if (!definition) {
    throw new Error(`Unknown AI provider: ${providerId}`);
  }
  return definition;
}

function normalizeStoredSecret(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function normalizeEnvSecret(value: string | undefined): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized ? normalized : null;
}

export function isAiProviderId(value: unknown): value is AiProviderId {
  return typeof value === 'string' && AI_PROVIDER_IDS.includes(value as AiProviderId);
}

export async function getAiProviderSecret(providerId: AiProviderId): Promise<{
  secret: string | null;
  updatedAt: string | null;
}> {
  const { aiProviderSecrets } = await getRepositories();
  const row = await aiProviderSecrets.findByProviderId(providerId);

  return {
    secret: normalizeStoredSecret(row?.secret),
    updatedAt: row?.updatedAt ?? null,
  };
}

export async function saveAiProviderSecret(
  providerId: AiProviderId,
  secret: string
): Promise<AiProviderStatus> {
  const normalizedSecret = secret.trim();
  if (!normalizedSecret) {
    throw new Error('AI provider secret cannot be empty');
  }

  const { aiProviderSecrets } = await getRepositories();
  await aiProviderSecrets.save(providerId, normalizedSecret);

  const status = await getAiProviderStatus(providerId);
  if (!status) {
    throw new Error(`Failed to persist AI provider secret for ${providerId}`);
  }
  return status;
}

export async function deleteAiProviderSecret(providerId: AiProviderId): Promise<AiProviderStatus> {
  const { aiProviderSecrets } = await getRepositories();
  await aiProviderSecrets.delete(providerId);

  const status = await getAiProviderStatus(providerId);
  if (!status) {
    throw new Error(`Failed to delete AI provider secret for ${providerId}`);
  }
  return status;
}

export async function getAiProviderStatus(providerId: AiProviderId): Promise<AiProviderStatus | null> {
  const definition = getAiProviderDefinition(providerId);
  const stored = await getAiProviderSecret(providerId);
  const envSecret = normalizeEnvSecret(process.env[definition.envVarName]);
  const configuredVia = stored.secret ? 'admin' : envSecret ? 'env' : null;

  return {
    id: definition.id,
    label: definition.label,
    configured: Boolean(stored.secret || envSecret),
    hasStoredSecret: Boolean(stored.secret),
    configuredVia,
    updatedAt: configuredVia === 'admin' ? stored.updatedAt : null,
  };
}

export async function getAiProviderStatuses(): Promise<AiProviderStatus[]> {
  return Promise.all(AI_PROVIDER_DEFINITIONS.map((definition) => getAiProviderStatus(definition.id))) as Promise<
    AiProviderStatus[]
  >;
}

export async function resolveAiProviderApiKey(providerId: AiProviderId): Promise<string | null> {
  const definition = getAiProviderDefinition(providerId);
  const stored = await getAiProviderSecret(providerId);
  if (stored.secret) {
    return stored.secret;
  }
  return normalizeEnvSecret(process.env[definition.envVarName]);
}
