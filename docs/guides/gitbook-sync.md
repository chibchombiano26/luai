# GitBook and auto-generated docs

GitBook is the publishing layer for the editorial docs in this repository. It does not generate API documentation by itself, so the project uses a split workflow:

1. GitBook syncs Markdown content from `docs/`.
2. TypeDoc generates technical reference content into `docs/reference/api`.
3. GitBook publishes both the editorial docs and the generated reference together.

## What is configured

- `/.gitbook.yaml` sets `docs/` as the content root.
- `docs/SUMMARY.md` defines the GitBook sidebar navigation.
- `docs/README.md` is the GitBook landing page.
- `typedoc.json` generates Markdown reference from the selected TypeScript sources.
- `npm run docs:build` regenerates the API reference.

## How to connect it in GitBook

1. Create or open a GitBook space.
2. Open `Integrations` or `Git Sync`.
3. Connect the GitHub repository and branch you want to publish.
4. On the initial import, sync from GitHub into GitBook.
5. Confirm that GitBook recognizes `docs/` as the content root through `/.gitbook.yaml`.

## Recommended workflow

When code changes affect public contracts or developer docs:

```bash
npm run docs:build
git add docs/ .gitbook.yaml typedoc.json package.json package-lock.json
git commit -m "docs: update gitbook content"
```

Editorial checklist:

- update architecture, guides, runbooks, or troubleshooting docs when behavior changed
- review `docs/SUMMARY.md` when adding or renaming pages
- verify internal links
- commit editorial updates together with the code change they describe

## Scope of each docs layer

- `docs/architecture/`: system design and runtime behavior
- `docs/guides/`: publishing and integration guidance
- `docs/runbooks/`: operational procedures
- `docs/troubleshooting/`: diagnosis and debugging
- `docs/reference/`: generated API reference

## Important limitations

- If modules do not include TSDoc or JSDoc comments, TypeDoc can only generate signatures and basic structure.
- GitBook organizes and publishes docs; it does not replace architecture docs, runbooks, or troubleshooting material.
- If React component-level documentation becomes important, expand `typedoc.json` or add a separate UI documentation layer such as Storybook.
