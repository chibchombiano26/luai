import { getRepositories } from '@/lib/repositories/repository-factory';

function buildFlowPackPrivateSettingId(packId: string, key: string): string {
  const normalizedPackId = packId.trim();
  const normalizedKey = key.trim();

  if (!normalizedPackId || !normalizedKey) {
    throw new Error('Flow-pack private setting requires a non-empty packId and key.');
  }

  return `flow_pack_private:${normalizedPackId}:${normalizedKey}`;
}

export async function getFlowPackPrivateJsonSetting<T>(
  packId: string,
  key: string,
  fallback: T,
  sanitize: (value: unknown) => T
): Promise<T> {
  const { platformSettings } = await getRepositories();
  const rowId = buildFlowPackPrivateSettingId(packId, key);
  const row = await platformSettings.findById(rowId);

  if (!row) {
    await platformSettings.save(rowId, JSON.stringify(fallback));
    return fallback;
  }

  try {
    return sanitize(JSON.parse(row.config));
  } catch {
    return fallback;
  }
}

export async function saveFlowPackPrivateJsonSetting<T>(
  packId: string,
  key: string,
  value: T
): Promise<void> {
  const { platformSettings } = await getRepositories();
  const rowId = buildFlowPackPrivateSettingId(packId, key);
  await platformSettings.save(rowId, JSON.stringify(value));
}
