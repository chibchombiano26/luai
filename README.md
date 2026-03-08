# LuAI

[![Landing](https://img.shields.io/badge/Landing-Live-00f2ff?style=flat-square)](https://chibchombiano26.github.io/luai/)
[![Docs](https://img.shields.io/badge/Docs-GitBook-3884FF?style=flat-square)](https://luai.gitbook.io/luai)
[![Tests](https://github.com/chibchombiano26/luai/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/chibchombiano26/luai/actions/workflows/tests.yml)
[![Coverage](https://codecov.io/gh/chibchombiano26/luai/branch/main/graph/badge.svg)](https://codecov.io/gh/chibchombiano26/luai)

[Leer en espanol](./README.es.md)

LuAI is a Next.js host for conversational workflows compiled at build time from `flow-packs/`.

The repository is split into two layers:
- a reusable host runtime under `src/`
- one or more product or domain packs under `flow-packs/`

The host owns the app shell, auth, chat runtime, admin UI, persistence, and generated registries. Each pack owns its cards, commands, prompts, backend tools, UI renderers, optional public pages, optional public API routes, and optional MCP integration.

Developer documentation is published at [luai.gitbook.io/luai](https://luai.gitbook.io/luai). Docs in this repository should be authored in English first.

## Current Status

- The public repository currently ships with one example pack: [`flow-packs/weather`](./flow-packs/weather).
- Pack integration is generated during build, not loaded dynamically at runtime.
- Public pages, API routes, chat commands, UI renderers, server tools, and MCP entrypoints are resolved from pack manifests.
- Local auth supports Clerk, Basic Auth fallback, and local-only development overrides.
- Coverage is tracked by scope: `core`, `packs`, and `all`.
- Core coverage enforces `95%` thresholds for statements, branches, functions, and lines.

## Quick Start

Requirements:
- Node.js `20+`
- npm `10+`

Install:

```bash
npm install
cp .env.example .env
```

Run locally:

```bash
npm run dev
```

Local URLs:
- App: [http://localhost:600](http://localhost:600)
- Chat API: [http://localhost:600/api/chat](http://localhost:600/api/chat)

Useful alternatives:

```bash
npm run dev:noauth
npm run build
npm run test
npm run docs:build
```

## Local Auth Modes

`npm run dev` starts the host on port `600` and regenerates flow-pack registries before booting Next.js.

Supported local auth modes:
- Use `npm run dev:noauth` to disable Clerk and Basic Auth for local development.
- Use `DEV_AUTH_ROLE=admin npm run dev` to keep Clerk sign-in but bypass missing local access assignment.
- Use `DEV_AUTH_GROUP=<group>` for a local-only group assignment override.
- Development overrides are ignored in production.

Basic Auth remains available as a fallback when Clerk is disabled or keys are missing.

## Repository Layout

```text
flow-packs/                 # Public local packs
examples/flow-pack-template # Starter template for new packs
scripts/
  build-flow-pack-registry.mjs
  run-dev.mjs
src/
  app/                      # Next.js App Router pages and generated mount wrappers
  components/               # Host UI
  hooks/                    # Host hooks
  lib/
    access/                 # Roles and access resolution
    chat/                   # Slash commands and chat helpers
    http/                   # HTTP debugging helpers
    platform/               # Pack contracts and generated registries
    profile/                # User profile and usage settings
    query/                  # React Query setup
  mcp-server/               # MCP bootstrap generated from packs
docs/                       # GitBook content root
docker-compose.yml          # Host + MCP + PostgreSQL local deployment
```

## How Flow Packs Work

`flow-packs/` is the source of truth for local packaged workflows.

Each pack can contribute:
- `cards/*.json`
- `server/index.ts`
- `ui/index.tsx`
- `pack.json -> publicPages`
- `pack.json -> publicApiRoutes`
- `pack.json -> mcp`
- `pack.json -> admin`

During `npm run build:flow-packs`, [`scripts/build-flow-pack-registry.mjs`](./scripts/build-flow-pack-registry.mjs) does the following:
- scans configured local directories and installed packages
- validates `pack.json` and card manifests
- resolves optional server, UI, public page, public API, and MCP modules
- generates static registries consumed by the host and MCP server
- generates public mount wrappers under `src/app/(generated-flow-packs)`

Generated outputs include:
- [`src/lib/platform/generated-flow-packs.ts`](./src/lib/platform/generated-flow-packs.ts)
- [`src/lib/platform/generated-flow-pack-server.ts`](./src/lib/platform/generated-flow-pack-server.ts)
- [`src/lib/platform/generated-flow-pack-ui.tsx`](./src/lib/platform/generated-flow-pack-ui.tsx)
- [`src/mcp-server/generated-flow-pack-mcp.ts`](./src/mcp-server/generated-flow-pack-mcp.ts)
- [`src/app/generated-flow-pack-sources.css`](./src/app/generated-flow-pack-sources.css)

Packs are compiled into the application during build. They are not loaded from arbitrary runtime code.

## Creating a New Pack

Start from the included template:

```bash
mkdir -p flow-packs/customer-support
cp -R examples/flow-pack-template/. flow-packs/customer-support
npm run build:flow-packs
```

Minimal expected structure:

```text
flow-packs/
  my-pack/
    pack.json
    cards/
      my_card.json
    server/
      index.ts
    ui/
      index.tsx
```

Required pack contract:
- `pack.json`
- `cards/`
- at least one `cards/*.json`

Required card metadata includes:
- `id`
- `packId`
- `kind`
- `order`
- `category`
- `defaultEnabled`
- `toolId`
- `supportedToolIds`
- localized `name`
- localized `description`
- localized `systemPromptByLocale`
- `commands`

Optional pack capabilities:
- public pages
- public API routes
- MCP bootstrap
- admin card options

## Public And Private Pack Sources

Pack discovery is driven by [`flow-packs.config.json`](./flow-packs.config.json) plus optional environment overrides.

Public defaults in this repository:

```json
{
  "publicLocalDirectories": ["flow-packs"],
  "localDirectories": ["flow-packs", "my-flow-packs"],
  "publicPackageNames": [],
  "packageNames": []
}
```

Supported source controls:
- `FLOW_PACKS_DIRS` for a comma-separated list of local pack directories
- `FLOW_PACK_PACKAGES` for installed pack packages

`npm run dev` auto-detects `private-packages/` and opts into `FLOW_PACKS_DIRS=flow-packs,my-flow-packs,private-packages` when that folder exists and no explicit pack source config was provided.

For private packs:
- keep the pack in a private repository or installed package
- add it through `FLOW_PACK_PACKAGES` or `packageNames`
- document its own environment variables in the private pack repository

## Admin Configuration

The host admin is pack-driven.

Pack metadata can define card-specific admin options, and the host renders them from the generated registry instead of hardcoding form state per pack.

Recommended public host configuration:
- AI provider secrets are managed from [`/admin/ai-providers`](./src/app/admin/ai-providers/page.tsx)
- Database provider settings are managed from [`/admin/database-provider`](./src/app/admin/database-provider/page.tsx)

Environment variable fallbacks still exist in code for bootstrap or headless environments, but they are intentionally not the primary public setup path.

## Testing And Coverage

Main scripts:

```bash
npm run test
npm run test:e2e
npm run test:coverage
npm run test:coverage:core
npm run test:coverage:packs
npm run test:coverage:all
```

Coverage scopes:
- `core`: reusable host runtime and platform primitives
- `packs`: pack code under `flow-packs/`
- `all`: full repository coverage

The coverage split exists because host logic and pack logic evolve independently. The `core` suite enforces `95%` thresholds.

## Docker And Deployment

For a generic local deployment with the host, MCP server, and PostgreSQL:

```bash
cp docker.env.example docker.env
docker compose --env-file docker.env up -d --build
```

That compose setup runs:
- the Next.js host
- the MCP server
- PostgreSQL

Notes:
- `POSTGRES_URL` becomes the active database provider in the compose environment.
- `DATABASE_URL` remains available as a SQLite fallback.
- If you install private packs from GitHub Packages, set `FLOW_PACK_PACKAGES` and `NODE_AUTH_TOKEN` before the image build.
- If a pack needs extra runtime-only variables, place them in `docker.runtime.env`.

## Main Environment Variables

Common host variables:
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_AUTH_ENABLED`
- `DEV_AUTH_ROLE`
- `DEV_AUTH_GROUP`
- `BASIC_AUTH_ENABLED`
- `BASIC_AUTH_USERNAME`
- `BASIC_AUTH_PASSWORD`
- `DEBUG_OUTBOUND_CURLS`
- `DEBUG_OUTBOUND_HTTP_DETAILS`

See [`.env.example`](./.env.example), [`docker.env.example`](./docker.env.example), and [`docker.runtime.env.example`](./docker.runtime.env.example) for current examples.

Pack-specific variables are not part of the public host contract and should be documented by the pack that requires them.

## Additional Documentation

- [`README.es.md`](./README.es.md)
- [`docs/README.md`](./docs/README.md)
- [`docs/architecture/overview.md`](./docs/architecture/overview.md)
- [`docs/runbooks/local-development.md`](./docs/runbooks/local-development.md)
- [`docs/testing/chat-manual-testing.md`](./docs/testing/chat-manual-testing.md)
- [`docs/troubleshooting/chat-debugging-guide.md`](./docs/troubleshooting/chat-debugging-guide.md)
