# Flow Pack Template

This folder is a starter template for building a new LuAI flow pack.

It intentionally lives outside `flow-packs/` so it is not compiled automatically by `npm run build:flow-packs`.

Typical workflow:

1. Copy this folder into `flow-packs/<your-pack-id>`
2. Rename ids, commands, and file names
3. Implement your server tools and UI renderers
4. Run `npm run build:flow-packs`
5. Fix validation errors until the generated registry succeeds

Example:

```bash
mkdir -p flow-packs/customer-support
cp -R examples/flow-pack-template/. flow-packs/customer-support
npm run build:flow-packs
```
