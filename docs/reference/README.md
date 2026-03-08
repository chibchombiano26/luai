# API Reference

This project's public technical reference is generated automatically from TypeScript and published inside GitBook as Markdown.

It is intentionally limited to host-level contracts that are safe to expose publicly. Private or domain-specific flow-pack details are excluded from this published subset.

## Regenerate

```bash
npm run docs:build
```

## Current coverage

- selected host modules under `src/lib`
- selected host hooks under `src/hooks`
- shared UI contracts such as `ThemeProvider`

The generated output is written to [`docs/reference/api`](api/README.md).
