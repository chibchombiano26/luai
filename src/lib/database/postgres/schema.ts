export const POSTGRES_SCHEMA = `
  CREATE TABLE IF NOT EXISTS platform_settings (
    id TEXT PRIMARY KEY,
    config TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ai_provider_secrets (
    provider_id TEXT PRIMARY KEY,
    secret TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ai_usage_events (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    model TEXT NOT NULL,
    locale TEXT NOT NULL,
    session_id TEXT,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_ai_usage_events_user_created_at
    ON ai_usage_events (username, created_at DESC);

  CREATE TABLE IF NOT EXISTS ai_quote_events (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    model TEXT NOT NULL,
    locale TEXT NOT NULL,
    session_id TEXT,
    quote_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_ai_quote_events_user_created_at
    ON ai_quote_events (username, created_at DESC);
`;
