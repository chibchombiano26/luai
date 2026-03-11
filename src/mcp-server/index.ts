import express from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  toEnabledFlowCardIdSet,
  toFlowCardConfigById,
} from '@/lib/platform/cards';
import { getFlowCardSettings } from '@/lib/platform/settings';
import {
  resolveEnabledFlowPackMcpTools,
  type ResolvedFlowPackMcpTool,
} from '@/lib/platform/pack-mcp';
import { GENERATED_FLOW_PACK_MCP_MODULES } from './generated-flow-pack-mcp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadEnvironment() {
  const envPath = path.resolve(__dirname, '../../.env');
  dotenv.config({ path: envPath });

  if (!process.env.DATABASE_URL && !process.env.TURSO_URL) {
    process.env.DATABASE_URL = path.resolve(__dirname, '../../quotes.db');
  }
}

async function getResolvedMcpTools(): Promise<{
  cardConfigById: Record<string, Record<string, unknown>>;
  enabledCardIds: ReadonlySet<string>;
  toolsByName: Map<string, ResolvedFlowPackMcpTool>;
}> {
  const settings = await getFlowCardSettings();
  const enabledCardIds = toEnabledFlowCardIdSet(settings);
  const cardConfigById = toFlowCardConfigById(settings);
  const toolsByName = resolveEnabledFlowPackMcpTools(
    GENERATED_FLOW_PACK_MCP_MODULES,
    enabledCardIds
  );

  return {
    cardConfigById,
    enabledCardIds,
    toolsByName,
  };
}

function serializeToolResult(result: unknown): { content: Array<{ type: 'text'; text: string }> } {
  if (typeof result === 'string') {
    return {
      content: [{ type: 'text', text: result }],
    };
  }

  if (result === undefined) {
    return {
      content: [{ type: 'text', text: '' }],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2) ?? String(result),
      },
    ],
  };
}

function createMcpServer() {
  const server = new Server(
    {
      name: 'flow-pack-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const { toolsByName } = await getResolvedMcpTools();

    return {
      tools: [...toolsByName.values()].map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const { toolsByName, enabledCardIds, cardConfigById } = await getResolvedMcpTools();
      const tool = toolsByName.get(name);

      if (!tool) {
        throw new Error(`Tool not found or inactive: ${name}`);
      }

      const result = await tool.execute(args, {
        packId: tool.packId,
        toolName: tool.name,
        enabledCardIds,
        cardConfigById,
      });

      return serializeToolResult(result);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        isError: true,
        content: [{ type: 'text', text: errorMessage }],
      };
    }
  });

  return server;
}

loadEnvironment();

const app = express();
app.use(cors());

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, service: 'flow-pack-mcp' });
});

const sseSessions = new Map<string, { transport: SSEServerTransport; server: Server }>();

app.get('/sse', async (_req, res) => {
  const server = createMcpServer();
  const transport = new SSEServerTransport('/messages', res);
  const sessionId = transport.sessionId;

  sseSessions.set(sessionId, { transport, server });
  await server.connect(transport);

  res.on('close', () => {
    sseSessions.delete(sessionId);
  });
});

app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId as string | undefined;
  if (!sessionId) {
    res.status(400).send('Missing sessionId');
    return;
  }

  const session = sseSessions.get(sessionId);
  if (!session) {
    res.status(404).send(`No active SSE transport for session ${sessionId}`);
    return;
  }

  await session.transport.handlePostMessage(req, res);
});

app.post('/streamable', async (req, res) => {
  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const server = createMcpServer();
  const transport = {
    onClose: () => {},
    onError: (error: Error) => {
      console.error('Transport error', error);
    },
    onMessage: (message: { method?: string }) => {
      console.log('Received message', message.method);
    },
    send: async (message: unknown) => {
      res.write(JSON.stringify(message) + '\n');
    },
    start: async () => {},
    close: async () => {
      res.end();
    },
  };

  await server.connect(transport as never);

  let buffer = '';
  req.on('data', (chunk: Buffer) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        transport.onMessage(JSON.parse(trimmed));
      } catch (error) {
        console.error('Failed to parse streamable message line', error);
      }
    }
  });

  req.on('end', () => {
    if (buffer.trim()) {
      try {
        transport.onMessage(JSON.parse(buffer.trim()));
      } catch {
        // Ignore invalid trailing data.
      }
    }
  });

  req.on('close', () => {
    transport.onClose();
  });
});

const port = Number(process.env.MCP_PORT || 604);
app.listen(port, () => {
  console.log(`MCP Server running on http://localhost:${port}`);
  console.log(`SSE endpoint: http://localhost:${port}/sse`);
});
