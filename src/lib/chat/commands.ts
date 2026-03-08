import type { AppLocale } from '@/lib/i18n';
import {
  GENERATED_CHAT_BACKEND_TOOL_IDS,
  GENERATED_CHAT_COMMAND_IDS,
  GENERATED_COMMAND_CATALOG,
  GENERATED_COMMAND_TO_BACKEND_TOOL,
  GENERATED_MENU_COMMAND_IDS,
} from '@/lib/platform/generated-flow-packs';

export const COMMAND_TO_BACKEND_TOOL =
  GENERATED_COMMAND_TO_BACKEND_TOOL as unknown as Record<ChatCommandId, ChatBackendToolId>;

export type ChatCommandId = (typeof GENERATED_CHAT_COMMAND_IDS)[number];
export type ChatBackendToolId = (typeof GENERATED_CHAT_BACKEND_TOOL_IDS)[number];

export const CHAT_COMMAND_IDS = [...GENERATED_CHAT_COMMAND_IDS] as ChatCommandId[];
export const CHAT_BACKEND_TOOL_IDS = [...GENERATED_CHAT_BACKEND_TOOL_IDS] as ChatBackendToolId[];

/** Commands shown in the slash-command menu. Subset of CHAT_COMMAND_IDS. */
export const MENU_COMMAND_IDS = [...GENERATED_MENU_COMMAND_IDS] as ChatCommandId[];

/** Localized metadata used to render and resolve slash commands. */
export type CommandCatalogEntry = {
  name: string;
  description: string;
  category: string;
  example: string;
  prompt: string;
  aliases: readonly string[];
  iconKey: string | null;
};

export type LocalizedCommandCatalog = Record<AppLocale, CommandCatalogEntry>;

const COMMAND_CATALOG =
  GENERATED_COMMAND_CATALOG as unknown as Record<ChatCommandId, LocalizedCommandCatalog>;

function normalizeSlashToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^\//, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-');
}

function getCommandSearchTokens(commandId: ChatCommandId): string[] {
  const aliases = [commandId, commandId.replace(/_/g, '-')];
  for (const locale of ['es', 'en'] as const) {
    const entry = COMMAND_CATALOG[commandId][locale];
    aliases.push(entry.example);
    aliases.push(...entry.aliases);
  }

  return Array.from(new Set(aliases.map(normalizeSlashToken).filter(Boolean)));
}

function extractSlashCommandToken(input: string): { token: string; remainder: string } | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return null;

  const withoutSlash = trimmed.slice(1).trim();
  if (!withoutSlash) return null;

  const [rawToken, ...restParts] = withoutSlash.split(/\s+/);
  const token = normalizeSlashToken(rawToken);
  if (!token) return null;

  return {
    token,
    remainder: restParts.join(' ').trim(),
  };
}

export function isChatCommandId(value: unknown): value is ChatCommandId {
  return typeof value === 'string' && CHAT_COMMAND_IDS.includes(value as ChatCommandId);
}

export function getCommandCatalogEntry(commandId: ChatCommandId, locale: AppLocale): CommandCatalogEntry {
  return COMMAND_CATALOG[commandId][locale];
}

export function getCommandPrompt(commandId: ChatCommandId, locale: AppLocale): string {
  return getCommandCatalogEntry(commandId, locale).prompt;
}

export function resolveSlashCommandInput(
  input: string,
  locale: AppLocale,
  allowedCommandIds?: readonly ChatCommandId[]
): { id: ChatCommandId; prompt: string; remainder: string } | null {
  const parsed = extractSlashCommandToken(input);
  if (!parsed) return null;

  const availableCommandIds = allowedCommandIds?.length
    ? CHAT_COMMAND_IDS.filter((id) => allowedCommandIds.includes(id))
    : CHAT_COMMAND_IDS;

  const exactMatches = availableCommandIds.filter((id) =>
    getCommandSearchTokens(id).includes(parsed.token)
  );
  if (exactMatches.length === 1) {
    const id = exactMatches[0];
    return {
      id,
      prompt: getCommandPrompt(id, locale),
      remainder: parsed.remainder,
    };
  }

  const prefixMatches = availableCommandIds.filter((id) =>
    getCommandSearchTokens(id).some((token) => token.startsWith(parsed.token))
  );
  if (prefixMatches.length === 1) {
    const id = prefixMatches[0];
    return {
      id,
      prompt: getCommandPrompt(id, locale),
      remainder: parsed.remainder,
    };
  }

  return null;
}
