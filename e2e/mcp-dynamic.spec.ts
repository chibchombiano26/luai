import { expect, test } from '@playwright/test';
import { Client } from '../src/mcp-server/node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js';
import { SSEClientTransport } from '../src/mcp-server/node_modules/@modelcontextprotocol/sdk/dist/esm/client/sse.js';
import {
  CallToolResultSchema,
  ListToolsResultSchema,
} from '../src/mcp-server/node_modules/@modelcontextprotocol/sdk/dist/esm/types.js';

const MCP_BASE_URL = process.env.E2E_MCP_URL || 'http://127.0.0.1:604';
const INSURANCE_MCP_TOOL_NAMES = new Set([
  'lookup_vehicle_by_plate',
  'quote_insurer_comparison',
  'quote_single_provider',
  'quote_vehicle_policy',
]);

type ProfileUiSettings = {
  showUsageSummary: boolean;
  showDailyUsageChart: boolean;
  showRecentTokenEvents: boolean;
};

type FlowCardRecord = {
  id: string;
  enabled: boolean;
  config: Record<string, unknown>;
};

type CardsSnapshot = {
  assistantAvatarPreset: string;
  profileUiSettings: ProfileUiSettings;
  cards: FlowCardRecord[];
};

async function waitForMcpHealth() {
  await expect
    .poll(async () => {
      try {
        const response = await fetch(`${MCP_BASE_URL}/health`);
        if (!response.ok) {
          return null;
        }

        return response.json();
      } catch {
        return null;
      }
    })
    .toEqual({ ok: true, service: 'flow-pack-mcp' });
}

async function getCardsSnapshot(apiBaseUrl: string): Promise<CardsSnapshot> {
  const response = await fetch(`${apiBaseUrl}/api/platform/cards?includeConfig=1`);
  expect(response.ok).toBeTruthy();
  return (await response.json()) as CardsSnapshot;
}

async function saveCardsSnapshot(apiBaseUrl: string, snapshot: CardsSnapshot): Promise<void> {
  const enabledByCardId = Object.fromEntries(snapshot.cards.map((card) => [card.id, card.enabled]));
  const configByCardId = Object.fromEntries(snapshot.cards.map((card) => [card.id, card.config]));

  const response = await fetch(`${apiBaseUrl}/api/platform/cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      enabledByCardId,
      configByCardId,
      profileUiSettings: snapshot.profileUiSettings,
      assistantAvatarPreset: snapshot.assistantAvatarPreset,
    }),
  });

  expect(response.ok).toBeTruthy();
}

async function setCardEnabledState(
  apiBaseUrl: string,
  baseline: CardsSnapshot,
  enabledByCardId: Partial<Record<string, boolean>>
): Promise<void> {
  await saveCardsSnapshot(apiBaseUrl, {
    ...baseline,
    cards: baseline.cards.map((card) => ({
      ...card,
      enabled:
        typeof enabledByCardId[card.id] === 'boolean' ? enabledByCardId[card.id] ?? card.enabled : card.enabled,
    })),
  });
}

async function withMcpClient<T>(run: (client: Client) => Promise<T>): Promise<T> {
  const transport = new SSEClientTransport(new URL(`${MCP_BASE_URL}/sse`));
  const client = new Client({
    name: 'playwright-e2e',
    version: '1.0.0',
  });

  await client.connect(transport);

  try {
    return await run(client);
  } finally {
    await transport.close();
  }
}

async function listMcpToolNames(): Promise<string[]> {
  return await withMcpClient(async (client) => {
    const result = await client.request(
      {
        method: 'tools/list',
        params: {},
      },
      ListToolsResultSchema
    );

    return result.tools.map((tool) => tool.name).sort();
  });
}

async function listInsuranceMcpToolNames(): Promise<string[]> {
  const tools = await listMcpToolNames();
  return tools.filter((tool) => INSURANCE_MCP_TOOL_NAMES.has(tool)).sort();
}

async function callMcpTool(name: string, args: Record<string, unknown>) {
  return await withMcpClient(async (client) => {
    return await client.request(
      {
        method: 'tools/call',
        params: {
          name,
          arguments: args,
        },
      },
      CallToolResultSchema
    );
  });
}

function parseToolTextResult(result: { content?: Array<{ type: string; text?: string }> } | undefined) {
  const text = result?.content?.find((item) => item.type === 'text')?.text;
  expect(typeof text).toBe('string');
  return JSON.parse(text as string) as Record<string, unknown>;
}

test.describe('embedded MCP runtime', () => {
  test.describe.configure({ mode: 'serial' });

  let baseline: CardsSnapshot;

  test.beforeAll(async ({ baseURL }) => {
    expect(baseURL).toBeTruthy();
    await waitForMcpHealth();
    baseline = await getCardsSnapshot(baseURL!);
  });

  test.afterAll(async ({ baseURL }) => {
    if (!baseURL || !baseline) {
      return;
    }

    await saveCardsSnapshot(baseURL, baseline);
  });

  test('serves app and MCP health endpoints', async ({ request, baseURL }) => {
    const appHealth = await request.get('/api/health');
    expect(appHealth.ok()).toBeTruthy();
    await expect(appHealth.json()).resolves.toEqual({ ok: true });

    const cardsResponse = await request.get('/api/platform/cards?includeConfig=1');
    expect(cardsResponse.ok()).toBeTruthy();

    const cards = (await cardsResponse.json()) as CardsSnapshot;
    expect(cards.cards.length).toBeGreaterThan(0);
    expect(baseURL).toBeTruthy();
  });

  test('exposes MCP tools dynamically from active cards', async ({ baseURL }) => {
    expect(baseURL).toBeTruthy();

    await setCardEnabledState(baseURL!, baseline, {
      insurer_comparison: false,
      single_provider_quote: true,
    });

    await expect.poll(async () => listInsuranceMcpToolNames()).toEqual([
      'lookup_vehicle_by_plate',
      'quote_single_provider',
    ]);

    const inactiveComparison = await callMcpTool('quote_insurer_comparison', {
      licensePlate: 'AAA111',
      fasecoldaCode: '08001136',
      vehicleYear: 2020,
      vehiclePrice: 50000000,
      insuredName: 'Test',
      insuredSurname: 'User',
      insuredDocumentNumber: '12345678',
      insuredBirthDate: '1990-01-01',
    });

    expect(inactiveComparison?.isError).toBe(true);
    expect(inactiveComparison?.content?.[0]?.text).toContain(
      'Tool not found or inactive: quote_insurer_comparison'
    );

    await setCardEnabledState(baseURL!, baseline, {
      insurer_comparison: true,
      single_provider_quote: false,
    });

    await expect.poll(async () => listInsuranceMcpToolNames()).toEqual([
      'lookup_vehicle_by_plate',
      'quote_insurer_comparison',
      'quote_vehicle_policy',
    ]);

    await setCardEnabledState(baseURL!, baseline, {
      insurer_comparison: false,
      single_provider_quote: false,
    });

    await expect.poll(async () => listInsuranceMcpToolNames()).toEqual([]);
  });

  test('returns mocked insurance quotes for active MCP tools', async ({ baseURL }) => {
    expect(baseURL).toBeTruthy();

    await setCardEnabledState(baseURL!, baseline, {
      insurer_comparison: true,
      single_provider_quote: true,
    });

    const quoteArgs = {
      licensePlate: 'ABC123',
      fasecoldaCode: '08001136',
      vehicleYear: 2020,
      vehiclePrice: 50000000,
      insuredName: 'Luisa',
      insuredSurname: 'Duque',
      insuredDocumentNumber: '1032419264',
      insuredBirthDate: '1988-08-27',
    };

    const singleProviderResult = await callMcpTool('quote_single_provider', {
      ...quoteArgs,
      providerCode: 'previsora',
      productPlan: 'AMPLIA',
    });
    const singleProviderPayload = parseToolTextResult(singleProviderResult);

    expect(singleProviderPayload).toMatchObject({
      type: 'single_provider_quote_result',
      source: 'e2e-mock',
      providerCode: 'previsora',
      licensePlate: 'ABC123',
      productPlan: 'AMPLIA',
      annualPremium: 1234567,
    });

    const comparisonResult = await callMcpTool('quote_insurer_comparison', quoteArgs);
    const comparisonPayload = parseToolTextResult(comparisonResult);

    expect(comparisonPayload).toMatchObject({
      type: 'insurer_comparison_result',
      source: 'e2e-mock',
      licensePlate: 'ABC123',
      recommendedProviderCode: 'previsora',
    });
    expect(comparisonPayload.providers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          providerCode: 'previsora',
          annualPremium: 1450000,
        }),
        expect.objectContaining({
          providerCode: 'solidaria',
          annualPremium: 1510000,
        }),
      ])
    );
  });
});
