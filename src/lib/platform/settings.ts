import { getRepositories } from '@/lib/repositories/repository-factory';
import {
  FlowCardSettings,
  FlowCardWithStatus,
  resolveFlowCardStatus,
  sanitizeFlowCardSettings,
  toEnabledFlowCardIdSet,
} from './cards';

const FLOW_CARD_SETTINGS_ROW_ID = 'flow_card_settings';

function parseSettingsJson(raw: string): FlowCardSettings {
  try {
    const parsed: unknown = JSON.parse(raw);
    return sanitizeFlowCardSettings(parsed);
  } catch {
    return { enabledByCardId: {}, configByCardId: {} };
  }
}

export async function getFlowCardSettings(): Promise<FlowCardSettings> {
  const { platformSettings } = await getRepositories();
  const row = await platformSettings.findById(FLOW_CARD_SETTINGS_ROW_ID);

  if (!row) {
    const defaultSettings: FlowCardSettings = { enabledByCardId: {}, configByCardId: {} };
    await platformSettings.save(FLOW_CARD_SETTINGS_ROW_ID, JSON.stringify(defaultSettings));
    return defaultSettings;
  }

  return parseSettingsJson(row.config);
}

export async function saveFlowCardSettings(settings: FlowCardSettings): Promise<FlowCardSettings> {
  const sanitized = sanitizeFlowCardSettings(settings);
  const { platformSettings } = await getRepositories();
  await platformSettings.save(FLOW_CARD_SETTINGS_ROW_ID, JSON.stringify(sanitized));

  return sanitized;
}

export async function getResolvedFlowCards(): Promise<FlowCardWithStatus[]> {
  const settings = await getFlowCardSettings();
  return resolveFlowCardStatus(settings);
}

export type { FlowCardWithStatus } from './cards';

export async function getEnabledFlowCardIdSet() {
  const settings = await getFlowCardSettings();
  return toEnabledFlowCardIdSet(settings);
}
