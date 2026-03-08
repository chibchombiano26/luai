# Chat Debugging Guide

Practical guide for diagnosing chat issues in the current project architecture.

## 1) Verify minimum environment

- `npm run dev` running at `http://localhost:600`
- Key variables configured:
  - `GOOGLE_GENERATIVE_AI_API_KEY`
  - `LANGFLOW_API_URL`
  - `LANGFLOW_API_KEY`

If `BASIC_AUTH_ENABLED` is not `false`, remember to authenticate for API routes as well.

## 2) Verify the main endpoint

Basic chat health check:

```bash
curl -i -X POST http://localhost:600/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hola"}],"locale":"es"}'
```

You should receive a stream (`text/event-stream`) or JSON chunks for tool/text events.

## 3) Verify external workflow integrations

If chat responds but a workflow-specific action fails:

- Check that the configured upstream base URL is reachable.
- Verify any required API key or auth header.
- Enable outbound debug logging to inspect the real request being sent.
- Check the server-side adapter logs for the failing workflow.

## 4) Validate in the browser

1. Open DevTools -> `Network`
2. Send a message on `/`
3. Inspect `POST /api/chat`
4. Confirm:
   - status `200`
   - streaming response
   - client appending messages in the UI

## 5) Common errors

- `401 Authentication required`: missing Basic Auth credentials.
- Timeout to Langflow: increase `LANGFLOW_API_TIMEOUT_MS` and validate network / SSL.
- `ENOTFOUND` or `ECONNREFUSED`: invalid or unreachable `LANGFLOW_API_URL`.

## 6) Useful commands

```bash
npm run test -- src/components/chat/Chat.test.tsx
npm run test -- src/components/chat/Chat.integration.test.tsx
npm run test -- src/app/api/chat/route.test.ts
```

## 7) Detailed outbound call logging

To inspect outbound HTTP traces:

- `DEBUG_OUTBOUND_CURLS=1`: prints the equivalent `curl` command.
- `DEBUG_OUTBOUND_HTTP_DETAILS=1`: prints request/response/error with `requestId`, duration, and sanitized payload.
- `OUTBOUND_HTTP_DEBUG_MAX_BODY_CHARS=2000`: limits payload size in detailed logs.
