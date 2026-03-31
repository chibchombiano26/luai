import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  deleteAiProviderSecret,
  getAiProviderSecret,
  getAiProviderStatus,
  getAiProviderStatuses,
  isAiProviderId,
  resolveAiProviderApiKey,
  saveAiProviderSecret,
} from './ai-providers';

const aiProviderSecrets = {
  findByProviderId: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
};

vi.mock('@/lib/repositories/repository-factory', () => ({
  getRepositories: vi.fn(async () => ({
    aiProviderSecrets,
  })),
}));

describe('ai-providers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    aiProviderSecrets.findByProviderId.mockResolvedValue(null);
    aiProviderSecrets.save.mockResolvedValue(undefined);
    aiProviderSecrets.delete.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('recognizes valid AI provider ids', () => {
    expect(isAiProviderId('gemini')).toBe(true);
    expect(isAiProviderId('other')).toBe(false);
    expect(isAiProviderId(null)).toBe(false);
  });

  it('normalizes stored secrets and updated timestamps', async () => {
    aiProviderSecrets.findByProviderId.mockResolvedValueOnce({
      providerId: 'gemini',
      secret: '  stored-secret  ',
      updatedAt: '2026-03-31T10:00:00.000Z',
    });

    await expect(getAiProviderSecret('gemini')).resolves.toEqual({
      secret: 'stored-secret',
      updatedAt: '2026-03-31T10:00:00.000Z',
    });
  });

  it('prefers stored admin secrets when resolving provider status and API key', async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'env-secret';
    aiProviderSecrets.findByProviderId.mockResolvedValue({
      providerId: 'gemini',
      secret: 'admin-secret',
      updatedAt: '2026-03-31T10:00:00.000Z',
    });

    await expect(getAiProviderStatus('gemini')).resolves.toEqual({
      id: 'gemini',
      label: {
        es: 'Google Gemini',
        en: 'Google Gemini',
      },
      configured: true,
      hasStoredSecret: true,
      configuredVia: 'admin',
      updatedAt: '2026-03-31T10:00:00.000Z',
    });
    await expect(resolveAiProviderApiKey('gemini')).resolves.toBe('admin-secret');
  });

  it('falls back to environment secrets when no stored secret exists', async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = '  env-secret  ';

    await expect(getAiProviderStatus('gemini')).resolves.toEqual({
      id: 'gemini',
      label: {
        es: 'Google Gemini',
        en: 'Google Gemini',
      },
      configured: true,
      hasStoredSecret: false,
      configuredVia: 'env',
      updatedAt: null,
    });
    await expect(resolveAiProviderApiKey('gemini')).resolves.toBe('env-secret');
  });

  it('saves and deletes provider secrets', async () => {
    aiProviderSecrets.findByProviderId.mockResolvedValue({
      providerId: 'gemini',
      secret: 'saved-secret',
      updatedAt: '2026-03-31T10:00:00.000Z',
    });

    await saveAiProviderSecret('gemini', '  saved-secret  ');
    expect(aiProviderSecrets.save).toHaveBeenCalledWith('gemini', 'saved-secret');

    await deleteAiProviderSecret('gemini');
    expect(aiProviderSecrets.delete).toHaveBeenCalledWith('gemini');
  });

  it('rejects empty provider secrets', async () => {
    await expect(saveAiProviderSecret('gemini', '   ')).rejects.toThrow(
      'AI provider secret cannot be empty'
    );
  });

  it('returns statuses for every configured provider definition', async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'env-secret';
    await expect(getAiProviderStatuses()).resolves.toHaveLength(1);
  });
});
