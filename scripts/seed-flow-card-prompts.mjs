#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { createClient } from '@libsql/client';

const FLOW_CARD_SETTINGS_ROW_ID = 'flow_card_settings';

function normalizePrompt(value, fallback) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return fallback;
}

function parseSettings(raw) {
  if (typeof raw !== 'string') {
    return { enabledByCardId: {}, configByCardId: {} };
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { enabledByCardId: {}, configByCardId: {} };
    }
    return {
      enabledByCardId:
        parsed.enabledByCardId && typeof parsed.enabledByCardId === 'object'
          ? parsed.enabledByCardId
          : {},
      configByCardId:
        parsed.configByCardId && typeof parsed.configByCardId === 'object'
          ? parsed.configByCardId
          : {},
    };
  } catch {
    return { enabledByCardId: {}, configByCardId: {} };
  }
}

async function loadDefaultPrompts() {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const defaultPromptsPath = path.resolve(
    dirname,
    '../src/lib/platform/default-card-system-prompts.json'
  );
  const raw = await fs.readFile(defaultPromptsPath, 'utf8');
  return JSON.parse(raw);
}

async function seedOnTurso(defaultPrompts) {
  const client = createClient({
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS payload_config (
      id TEXT PRIMARY KEY,
      config TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const existing = await client.execute({
    sql: 'SELECT config FROM payload_config WHERE id = ?',
    args: [FLOW_CARD_SETTINGS_ROW_ID],
  });
  const rawConfig = existing.rows[0]?.config;
  const current = parseSettings(typeof rawConfig === 'string' ? rawConfig : '');

  const nextConfigByCardId = { ...current.configByCardId };
  for (const [cardId, localized] of Object.entries(defaultPrompts)) {
    const currentCardConfig =
      nextConfigByCardId[cardId] &&
      typeof nextConfigByCardId[cardId] === 'object' &&
      !Array.isArray(nextConfigByCardId[cardId])
        ? nextConfigByCardId[cardId]
        : {};
    const currentLocalized =
      currentCardConfig.systemPromptByLocale &&
      typeof currentCardConfig.systemPromptByLocale === 'object' &&
      !Array.isArray(currentCardConfig.systemPromptByLocale)
        ? currentCardConfig.systemPromptByLocale
        : {};

    nextConfigByCardId[cardId] = {
      ...currentCardConfig,
      systemPromptByLocale: {
        ...currentLocalized,
        es: normalizePrompt(currentLocalized.es, localized.es),
        en: normalizePrompt(currentLocalized.en, localized.en),
      },
    };
  }

  const nextSettings = {
    enabledByCardId: current.enabledByCardId,
    configByCardId: nextConfigByCardId,
  };

  await client.execute({
    sql: `
      INSERT INTO payload_config (id, config)
      VALUES (?, ?)
      ON CONFLICT(id)
      DO UPDATE SET
        config = excluded.config,
        updated_at = CURRENT_TIMESTAMP
    `,
    args: [FLOW_CARD_SETTINGS_ROW_ID, JSON.stringify(nextSettings)],
  });
}

async function seedOnLocalSqlite(defaultPrompts) {
  const dbPath = process.env.DATABASE_URL || path.resolve(process.cwd(), 'quotes.db');
  const db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS payload_config (
      id TEXT PRIMARY KEY,
      config TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const existing = db
    .prepare('SELECT config FROM payload_config WHERE id = ?')
    .get(FLOW_CARD_SETTINGS_ROW_ID);
  const current = parseSettings(existing?.config);

  const nextConfigByCardId = { ...current.configByCardId };
  for (const [cardId, localized] of Object.entries(defaultPrompts)) {
    const currentCardConfig =
      nextConfigByCardId[cardId] &&
      typeof nextConfigByCardId[cardId] === 'object' &&
      !Array.isArray(nextConfigByCardId[cardId])
        ? nextConfigByCardId[cardId]
        : {};
    const currentLocalized =
      currentCardConfig.systemPromptByLocale &&
      typeof currentCardConfig.systemPromptByLocale === 'object' &&
      !Array.isArray(currentCardConfig.systemPromptByLocale)
        ? currentCardConfig.systemPromptByLocale
        : {};

    nextConfigByCardId[cardId] = {
      ...currentCardConfig,
      systemPromptByLocale: {
        ...currentLocalized,
        es: normalizePrompt(currentLocalized.es, localized.es),
        en: normalizePrompt(currentLocalized.en, localized.en),
      },
    };
  }

  const nextSettings = {
    enabledByCardId: current.enabledByCardId,
    configByCardId: nextConfigByCardId,
  };

  db.prepare(
    `
      INSERT INTO payload_config (id, config)
      VALUES (?, ?)
      ON CONFLICT(id)
      DO UPDATE SET
        config = excluded.config,
        updated_at = CURRENT_TIMESTAMP
    `
  ).run(FLOW_CARD_SETTINGS_ROW_ID, JSON.stringify(nextSettings));

  db.close();
}

async function main() {
  const defaultPrompts = await loadDefaultPrompts();

  if (process.env.TURSO_URL) {
    await seedOnTurso(defaultPrompts);
    console.log(
      `Seed completed on Turso for ${Object.keys(defaultPrompts).length} widgets (flow_card_settings).`
    );
    return;
  }

  await seedOnLocalSqlite(defaultPrompts);
  console.log(
    `Seed completed on local SQLite for ${Object.keys(defaultPrompts).length} widgets (flow_card_settings).`
  );
}

main().catch((error) => {
  console.error('Flow-card prompt seed failed:', error);
  process.exit(1);
});
