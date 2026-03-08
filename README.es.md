# LuAI

[![Landing](https://img.shields.io/badge/Landing-Live-00f2ff?style=flat-square)](https://chibchombiano26.github.io/luai/)
[![Docs](https://img.shields.io/badge/Docs-GitBook-3884FF?style=flat-square)](https://luai.gitbook.io/luai)
[![Tests](https://github.com/chibchombiano26/luai/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/chibchombiano26/luai/actions/workflows/tests.yml)
[![Coverage](https://codecov.io/gh/chibchombiano26/luai/branch/main/graph/badge.svg)](https://codecov.io/gh/chibchombiano26/luai)

[Read in English](./README.md)

LuAI es un host en Next.js para flujos conversacionales compilados en build time desde `flow-packs/`.

El repositorio se divide en dos capas:
- un runtime host reutilizable en `src/`
- uno o más packs de producto o dominio en `flow-packs/`

El host controla el app shell, auth, runtime de chat, UI de admin, persistencia y registros generados. Cada pack controla sus cards, comandos, prompts, tools de backend, renderers de UI, páginas públicas opcionales, rutas API públicas opcionales e integración MCP opcional.

La documentación para developers está publicada en [luai.gitbook.io/luai](https://luai.gitbook.io/luai). En este repositorio, la documentación debe escribirse primero en inglés.

## Estado Actual

- El repositorio público incluye actualmente un pack de ejemplo: [`flow-packs/weather`](./flow-packs/weather).
- La integración de packs se genera durante el build; no se carga dinámicamente en runtime.
- Las páginas públicas, rutas API, comandos de chat, renderers de UI, tools de servidor y entrypoints MCP se resuelven desde los manifiestos de cada pack.
- La autenticación local soporta Clerk, fallback a Basic Auth y overrides solo para desarrollo.
- La cobertura se mide por scope: `core`, `packs` y `all`.
- El scope `core` exige umbrales de `95%` para statements, branches, functions y lines.

## Inicio Rapido

Requisitos:
- Node.js `20+`
- npm `10+`

Instalacion:

```bash
npm install
cp .env.example .env
```

Ejecutar local:

```bash
npm run dev
```

URLs locales:
- App: [http://localhost:600](http://localhost:600)
- API de chat: [http://localhost:600/api/chat](http://localhost:600/api/chat)

Alternativas utiles:

```bash
npm run dev:noauth
npm run build
npm run test
npm run docs:build
```

## Modos De Auth Local

`npm run dev` arranca el host en el puerto `600` y regenera los registros de flow-packs antes de levantar Next.js.

Modos soportados:
- Usa `npm run dev:noauth` para desactivar Clerk y Basic Auth en desarrollo local.
- Usa `DEV_AUTH_ROLE=admin npm run dev` para mantener el sign-in con Clerk pero saltarte la falta de asignacion local de acceso.
- Usa `DEV_AUTH_GROUP=<group>` para asignar un grupo local solo en desarrollo.
- Los overrides de desarrollo se ignoran en produccion.

Basic Auth sigue disponible como fallback cuando Clerk esta desactivado o faltan las llaves.

## Estructura Del Repositorio

```text
flow-packs/                 # Packs locales publicos
examples/flow-pack-template # Template inicial para nuevos packs
scripts/
  build-flow-pack-registry.mjs
  run-dev.mjs
src/
  app/                      # Paginas App Router y wrappers generados para mounts
  components/               # UI del host
  hooks/                    # Hooks del host
  lib/
    access/                 # Roles y resolucion de acceso
    chat/                   # Slash commands y helpers de chat
    http/                   # Helpers de depuracion HTTP
    platform/               # Contratos de packs y registros generados
    profile/                # Perfil de usuario y settings de uso
    query/                  # Configuracion de React Query
  mcp-server/               # Bootstrap MCP generado desde packs
docs/                       # Raiz de contenido para GitBook
docker-compose.yml          # Despliegue local con host + MCP + PostgreSQL
```

## Como Funcionan Los Flow Packs

`flow-packs/` es la fuente de verdad para los workflows empaquetados locales.

Cada pack puede aportar:
- `cards/*.json`
- `server/index.ts`
- `ui/index.tsx`
- `pack.json -> publicPages`
- `pack.json -> publicApiRoutes`
- `pack.json -> mcp`
- `pack.json -> admin`

Durante `npm run build:flow-packs`, [`scripts/build-flow-pack-registry.mjs`](./scripts/build-flow-pack-registry.mjs) hace lo siguiente:
- escanea directorios locales configurados y paquetes instalados
- valida `pack.json` y los manifiestos de cards
- resuelve modulos opcionales de server, UI, paginas publicas, APIs publicas y MCP
- genera registros estaticos consumidos por el host y el servidor MCP
- genera wrappers de mounts publicos bajo `src/app/(generated-flow-packs)`

Las salidas generadas incluyen:
- [`src/lib/platform/generated-flow-packs.ts`](./src/lib/platform/generated-flow-packs.ts)
- [`src/lib/platform/generated-flow-pack-server.ts`](./src/lib/platform/generated-flow-pack-server.ts)
- [`src/lib/platform/generated-flow-pack-ui.tsx`](./src/lib/platform/generated-flow-pack-ui.tsx)
- [`src/mcp-server/generated-flow-pack-mcp.ts`](./src/mcp-server/generated-flow-pack-mcp.ts)
- [`src/app/generated-flow-pack-sources.css`](./src/app/generated-flow-pack-sources.css)

Los packs se compilan dentro de la aplicacion durante el build. No se cargan desde codigo arbitrario en runtime.

## Crear Un Pack Nuevo

Empieza desde el template incluido:

```bash
mkdir -p flow-packs/customer-support
cp -R examples/flow-pack-template/. flow-packs/customer-support
npm run build:flow-packs
```

Estructura minima esperada:

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

Contrato requerido del pack:
- `pack.json`
- `cards/`
- al menos un `cards/*.json`

Metadata requerida de cada card:
- `id`
- `packId`
- `kind`
- `order`
- `category`
- `defaultEnabled`
- `toolId`
- `supportedToolIds`
- `name` localizado
- `description` localizada
- `systemPromptByLocale` localizado
- `commands`

Capacidades opcionales del pack:
- paginas publicas
- rutas API publicas
- bootstrap MCP
- opciones de admin por card

## Fuentes Publicas Y Privadas De Packs

El descubrimiento de packs se controla desde [`flow-packs.config.json`](./flow-packs.config.json) y overrides opcionales por variables de entorno.

Valores publicos por defecto en este repo:

```json
{
  "publicLocalDirectories": ["flow-packs"],
  "localDirectories": ["flow-packs", "my-flow-packs"],
  "publicPackageNames": [],
  "packageNames": []
}
```

Controles soportados:
- `FLOW_PACKS_DIRS` para una lista separada por comas de directorios locales
- `FLOW_PACK_PACKAGES` para paquetes de packs instalados

`npm run dev` detecta automaticamente `private-packages/` y activa `FLOW_PACKS_DIRS=flow-packs,my-flow-packs,private-packages` cuando esa carpeta existe y no se definio una configuracion explicita de fuentes.

Para packs privados:
- manten el pack en un repositorio privado o paquete instalado
- agregalo mediante `FLOW_PACK_PACKAGES` o `packageNames`
- documenta sus variables de entorno en el propio repositorio privado del pack

## Configuracion Desde Admin

El admin del host es pack-driven.

La metadata del pack puede definir opciones de admin por card, y el host las renderiza desde el registro generado sin hardcodear formularios por pack.

Configuracion publica recomendada del host:
- los secretos de providers AI se administran desde [`/admin/ai-providers`](./src/app/admin/ai-providers/page.tsx)
- la configuracion del proveedor de base de datos se administra desde [`/admin/database-provider`](./src/app/admin/database-provider/page.tsx)

Los fallbacks por variables de entorno siguen existiendo en codigo para bootstrap o entornos headless, pero intencionalmente no son la ruta principal del setup publico.

## Testing Y Coverage

Scripts principales:

```bash
npm run test
npm run test:e2e
npm run test:coverage
npm run test:coverage:core
npm run test:coverage:packs
npm run test:coverage:all
```

Scopes de coverage:
- `core`: runtime reutilizable del host y primitivas de plataforma
- `packs`: codigo de packs bajo `flow-packs/`
- `all`: cobertura total del repositorio

La separacion existe porque la logica del host y la de los packs evolucionan de forma independiente. El suite `core` exige umbrales de `95%`.

## Docker Y Despliegue

Para un despliegue local generico con host, servidor MCP y PostgreSQL:

```bash
cp docker.env.example docker.env
docker compose --env-file docker.env up -d --build
```

Ese compose levanta:
- el host Next.js
- el servidor MCP
- PostgreSQL

Notas:
- `POSTGRES_URL` queda como proveedor activo en el entorno de compose.
- `DATABASE_URL` sigue disponible como fallback a SQLite.
- Si instalas packs privados desde GitHub Packages, define `FLOW_PACK_PACKAGES` y `NODE_AUTH_TOKEN` antes del build de la imagen.
- Si un pack necesita variables extra solo de runtime, colocalas en `docker.runtime.env`.

## Variables De Entorno Principales

Variables comunes del host:
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

Consulta [`.env.example`](./.env.example), [`docker.env.example`](./docker.env.example) y [`docker.runtime.env.example`](./docker.runtime.env.example) para ejemplos vigentes.

Las variables especificas de cada pack no forman parte del contrato publico del host y deben documentarse en el pack que las requiera.

## Documentacion Adicional

- [`README.md`](./README.md)
- [`docs/README.md`](./docs/README.md)
- [`docs/architecture/overview.md`](./docs/architecture/overview.md)
- [`docs/runbooks/local-development.md`](./docs/runbooks/local-development.md)
- [`docs/testing/chat-manual-testing.md`](./docs/testing/chat-manual-testing.md)
- [`docs/troubleshooting/chat-debugging-guide.md`](./docs/troubleshooting/chat-debugging-guide.md)
