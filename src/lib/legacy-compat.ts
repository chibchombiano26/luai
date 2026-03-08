export const LEGACY_LOCALE_STORAGE_KEYS = ['legacy_locale'] as const;

export const LEGACY_PAYLOAD_OVERRIDES_STORAGE_KEYS = ['legacy_payload_overrides'] as const;

export const LEGACY_CHAT_SESSIONS_STORAGE_KEYS = ['legacy_chat_sessions_v1'] as const;

export const LEGACY_ACTIVE_CHAT_SESSION_ID_STORAGE_KEYS = [
  'legacy_active_chat_session_id',
] as const;

export const LEGACY_CHAT_TOOL_TYPE_ALIASES = {
  legacy_tips: 'guidance_tips',
  legacy_calculator: 'quote_calculator',
} as const;
