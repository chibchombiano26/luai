# Project Documentation

Primary documentation portal for `LuAI`.

LuAI is a Next.js host for conversational workflows compiled at build time from `flow-packs/`. The public repository currently ships with one example pack, `weather`, while the host remains ready to integrate additional local or packaged packs through generated registries.

This folder is the GitBook content root configured through [`/.gitbook.yaml`](https://github.com/chibchombiano26/luai/blob/main/.gitbook.yaml).

Docs in this folder should be authored in English first. Spanish remains an additional translation or runtime locale, not the primary source language for developer docs.

## Quick Start

Common commands:

```bash
npm install
cp .env.example .env
npm run dev
npm run test
npm run docs:build
```

Useful local URLs:
- App: `http://localhost:600`
- Chat API: `http://localhost:600/api/chat`

Local auth shortcuts:
- `npm run dev:noauth` disables Clerk and Basic Auth locally.
- `DEV_AUTH_ROLE=admin npm run dev` keeps Clerk sign-in while bypassing missing local access assignment.
- `DEV_AUTH_GROUP=<group>` enables a local-only group override.

## Quick Map

### Overview

- [Platform overview](architecture/overview.md)
- [Host and flow-pack architecture](architecture/flow-packs.md)
- [Chat request lifecycle](architecture/chat-runtime.md)

### Guides

- [GitBook and auto-generated docs](guides/gitbook-sync.md)

### Runbooks

- [Local development and core commands](runbooks/local-development.md)
- [Publishing docs and GitBook](runbooks/publishing-docs.md)
- [Chat troubleshooting](troubleshooting/chat-debugging-guide.md)
- [Manual chat testing](testing/chat-manual-testing.md)

### Reference

- [Generated API reference](reference/README.md)
- [Static landing for GitHub Pages](index.html)

### History

- [Historic chat streaming fix](history/chat-streaming-fix-summary.md)

## Documentation Workflow

Use this split to keep GitBook readable:
- `architecture/` explains system design and runtime behavior
- `guides/` explains integrations such as GitBook and generated reference docs
- `runbooks/` documents repeatable operational tasks
- `troubleshooting/` focuses on diagnosis and debugging
- `reference/` contains generated API output

Regenerate technical reference docs with:

```bash
npm run docs:build
```

When code changes affect architecture, setup, runtime behavior, or deployment, update the editorial Markdown files in `docs/` together with the generated reference when applicable.
