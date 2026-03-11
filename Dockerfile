FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

FROM node:20-bookworm-slim AS mcp-deps
WORKDIR /app
COPY src/mcp-server/package.json src/mcp-server/package-lock.json ./src/mcp-server/
RUN npm --prefix ./src/mcp-server ci

FROM node:20-bookworm-slim AS builder
WORKDIR /app
ARG FLOW_PACKS_DIR=flow-packs
ARG FLOW_PACK_PACKAGES=
ARG PUBLIC_FLOW_PACK_PACKAGES=
ARG NODE_AUTH_TOKEN=
ARG NEXT_PUBLIC_APP_URL=
ARG APP_URL_OVERRIDE=
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
ARG CLERK_SECRET_KEY=
ARG CLERK_AUTH_ENABLED=
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV APP_URL_OVERRIDE=${APP_URL_OVERRIDE}
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
ENV CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
ENV CLERK_AUTH_ENABLED=${CLERK_AUTH_ENABLED}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p private-packages my-flow-packs
RUN FLOW_PACKS_DIR="${FLOW_PACKS_DIR}" \
    FLOW_PACK_PACKAGES="${FLOW_PACK_PACKAGES}" \
    PUBLIC_FLOW_PACK_PACKAGES="${PUBLIC_FLOW_PACK_PACKAGES}" \
    NODE_AUTH_TOKEN="${NODE_AUTH_TOKEN}" \
    npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV MCP_PORT=604
ENV NEXT_TELEMETRY_DISABLED=1

RUN useradd --system --create-home --uid 1001 nextjs

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=mcp-deps /app/src/mcp-server/node_modules ./src/mcp-server/node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/landing ./landing
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/flow-packs.config.json ./flow-packs.config.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/scripts/start-runtime.mjs ./scripts/start-runtime.mjs
COPY --from=builder /app/src/lib ./src/lib
COPY --from=builder /app/src/mcp-server ./src/mcp-server
COPY --from=builder /app/flow-packs ./flow-packs
COPY --from=builder /app/my-flow-packs ./my-flow-packs
COPY --from=builder /app/private-packages ./private-packages

RUN mkdir -p /app/data && chown nextjs:nextjs /app/data

USER nextjs
EXPOSE 3000
EXPOSE 604

CMD ["node", "scripts/start-runtime.mjs"]
