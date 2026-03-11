# LuAI Repository Guide

LuAI is a generic Next.js host for compile-time `flow-packs`.

## Current shape

- `src/` contains the reusable host application.
- `flow-packs/weather` is the only public example pack kept in this repository.
- private or proprietary packs should live in separate private repositories and be installed as packages.

## Build model

`npm run build:flow-packs` scans local pack directories and any configured private pack packages, then regenerates:

- `src/lib/platform/generated-flow-packs.ts`
- `src/lib/platform/generated-flow-pack-server.ts`
- `src/lib/platform/generated-flow-pack-ui.tsx`
- `src/mcp-server/generated-flow-pack-mcp.ts`
- any generated public page/API mounts under `src/app`

Do not edit generated files manually.

## Private packs

Use [flow-packs.config.json](/Users/jose.ramirez/Development/personal/generative_ui/flow-packs.config.json) to point the host at private packages or local private pack directories:

```json
{
  "localDirectories": ["flow-packs", "my-flow-packs", "private-packages"],
  "packageNames": ["@your-org/luai-pack-private-domain"]
}
```

Expected package contract:

- `pack.json`
- `cards/*.json`
- `server/index`
- `ui/index`
- optional `mcp/index`
- optional public page/API modules declared from `pack.json`

## Useful commands

```bash
npm run build:flow-packs
npm run dev
npm test
npm run test:coverage
```

## MCP host

The MCP runtime lives in `src/mcp-server/`. Packs contribute MCP tool modules, and the shared host exposes only the operations enabled by the active cards.
