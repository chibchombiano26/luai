export interface AiProviderSecretRecord {
  providerId: string;
  secret: string | null;
  updatedAt: string | null;
}

export interface AiProviderSecretRepository {
  findByProviderId(providerId: string): Promise<AiProviderSecretRecord | null>;
  save(providerId: string, secret: string): Promise<void>;
  delete(providerId: string): Promise<void>;
}
