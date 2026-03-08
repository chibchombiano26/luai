# Publishing docs and GitBook

This repository supports two documentation outputs:

- GitBook, reading Markdown from `docs/`
- GitHub Pages, serving the static landing in `docs/index.html`

## Before publishing

Regenerate the technical reference:

```bash
npm run docs:build
```

If behavior, architecture, setup, or operational steps changed, also update the editorial Markdown files under `docs/`.

## Publish to GitBook

1. Create or open the GitBook space.
2. Connect the repository through Git Sync.
3. Import the repository branch into GitBook.
4. Confirm that `docs/` is the content root through `/.gitbook.yaml`.
5. Review the rendered sidebar and landing page after sync.

Key files:

- [`/.gitbook.yaml`](https://github.com/chibchombiano26/luai/blob/main/.gitbook.yaml)
- [`docs/SUMMARY.md`](https://github.com/chibchombiano26/luai/blob/main/docs/SUMMARY.md)
- [`docs/README.md`](https://github.com/chibchombiano26/luai/blob/main/docs/README.md)
- [`docs/reference/README.md`](https://github.com/chibchombiano26/luai/blob/main/docs/reference/README.md)

## Publish to GitHub Pages

If you only need the static landing page:

```text
Settings -> Pages -> Build and deployment -> Source -> Deploy from a branch
Branch -> main
Folder -> /docs
```

That serves `docs/index.html`, `docs/landing.css`, and `docs/landing.js` without needing a Next.js build.

## Recommended editorial split

Use this structure to keep GitBook readable:

- `architecture/`: how the system is built and how runtime behavior works
- `guides/`: GitBook and generated-doc integration guidance
- `runbooks/`: repeatable operational procedures
- `troubleshooting/`: incident diagnosis
- `reference/`: automatically generated output

## Quick checklist

- run `npm run docs:build`
- review `docs/reference/api`
- review `docs/README.md`
- review `docs/SUMMARY.md`
- verify internal links
- commit doc updates together with the code change they describe
