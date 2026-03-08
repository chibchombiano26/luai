import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getDatabaseProviderStatus } from '@/lib/database-provider-config';
import { getPostgresClient, resetPostgresClient } from '@/lib/database/postgres/client';
import { getRepositories, resetRepositoryFactory } from '@/lib/repositories/repository-factory';

describe('postgres integration', () => {
  beforeAll(async () => {
    resetRepositoryFactory();
    await resetPostgresClient();
  });

  afterAll(async () => {
    resetRepositoryFactory();
    await resetPostgresClient();
  });

  it('uses postgres as active provider and persists data through the repositories', async () => {
    const status = await getDatabaseProviderStatus();
    if (status.selectedProvider !== 'postgres') {
      return;
    }

    const client = await getPostgresClient();
    const repositories = await getRepositories();
    const suffix = `it_${Date.now()}`;

    const platformSettingsId = `platform_${suffix}`;
    const usageId = `usage_${suffix}`;
    const quoteEventId = `quote_event_${suffix}`;

    try {
      await repositories.platformSettings.save(platformSettingsId, JSON.stringify({ enabled: true }));
      const platformSettings = await repositories.platformSettings.findById(platformSettingsId);
      expect(platformSettings?.config).toBe(JSON.stringify({ enabled: true }));

      await repositories.aiProviderSecrets.save('gemini', `secret_${suffix}`);
      const aiSecret = await repositories.aiProviderSecrets.findByProviderId('gemini');
      expect(aiSecret?.secret).toBe(`secret_${suffix}`);

      await repositories.usageEvents.insertUsageEvent({
        id: usageId,
        username: 'integration-user',
        model: 'gemini',
        locale: 'es',
        sessionId: null,
        inputTokens: 10,
        outputTokens: 20,
        totalTokens: 30,
      });
      await repositories.usageEvents.insertQuoteEvent({
        id: quoteEventId,
        username: 'integration-user',
        model: 'gemini',
        locale: 'es',
        sessionId: null,
        quoteCount: 1,
      });

      const usageAggregate = await repositories.usageEvents.getUsageAggregateByUsername('integration-user');
      const quoteAggregate = await repositories.usageEvents.getQuoteAggregateByUsername('integration-user');

      expect(usageAggregate.totalTokens).toBeGreaterThanOrEqual(30);
      expect(quoteAggregate.totalQuotes).toBeGreaterThanOrEqual(1);
    } finally {
      await client.query('DELETE FROM ai_quote_events WHERE id = $1', [quoteEventId]);
      await client.query('DELETE FROM ai_usage_events WHERE id = $1', [usageId]);
      await client.query('DELETE FROM ai_provider_secrets WHERE provider_id = $1', ['gemini']);
      await client.query('DELETE FROM platform_settings WHERE id = $1', [platformSettingsId]);
    }
  });
});
