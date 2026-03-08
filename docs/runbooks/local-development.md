# Local development and core commands

## Requirements

- Node.js `20+`
- npm `10+`

## Installation

```bash
npm install
cp .env.example .env
```

## Most used commands

```bash
npm run dev
npm run dev:noauth
npm run build:flow-packs
npm run build
npm run test
npm run test:coverage:core
npm run docs:build
```

## Useful URLs

- App local: `http://localhost:600`
- Chat API: `http://localhost:600/api/chat`

## Auth options for local development

- Use `npm run dev:noauth` when you do not need Clerk or Basic Auth locally.
- Use `DEV_AUTH_ROLE=admin npm run dev` when you want Clerk sign-in but your local user has no assigned role or group yet.
- `DEV_AUTH_GROUP` is supported for local-only group assignment.
- Development overrides are ignored in production.
- Basic Auth is used as fallback when Clerk is disabled or its keys are missing.

## Pack source options

Pack discovery can be controlled with:

- `FLOW_PACKS_DIRS` for local directories
- `FLOW_PACK_PACKAGES` for installed pack packages

Defaults in the public repo come from `flow-packs.config.json`.

`npm run dev` will automatically include `private-packages/` through `FLOW_PACKS_DIRS=flow-packs,my-flow-packs,private-packages` when that folder exists and you did not already define pack sources explicitly.

Useful commands:

```bash
npm run dev:private-packs
npm run dev:noauth:private-packs
```

## Recommended flow when editing packs

1. Edit `flow-packs/<pack-id>/...` or your configured local/private pack source.
2. Run `npm run build:flow-packs` or `npm run dev`.
3. Verify that generated host files changed as expected.
4. Test UI, public routes, and API routes if the pack uses them.
5. Run coverage if the change affects host runtime behavior.

## Common environment variables

Most frequently used host variables:

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

Pack-specific variables should be documented by the pack that requires them.

## If something fails

- Use the [Chat troubleshooting](../troubleshooting/chat-debugging-guide.md) runbook.
- Run the [Manual chat testing](../testing/chat-manual-testing.md) checklist.
- Regenerate docs with `npm run docs:build` if you changed public contracts or reference docs.
