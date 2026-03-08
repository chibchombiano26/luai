export interface PlatformSettingsRecord {
  id: string;
  config: string;
  updatedAt: string | null;
}

export interface PlatformSettingsRepository {
  findById(id: string): Promise<PlatformSettingsRecord | null>;
  save(id: string, config: string): Promise<void>;
}
