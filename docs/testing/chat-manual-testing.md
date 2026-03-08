# Manual Chat Testing

Quick checklist to validate the end-to-end chat flow.

## Setup

```bash
npm run dev
```

Open `http://localhost:600`.

## Case 1: Basic conversation

1. Type `hello`.
2. Verify that both appear:
   - user message
   - assistant response

## Case 2: Enabled workflow invocation

1. Trigger an enabled public workflow, for example the weather flow if it is active.
2. Verify that:
   - the assistant uses the intended tool or card
   - the workflow-specific UI renders correctly
   - the response completes without console or network errors

## Case 3: History and sessions

1. Create several conversations.
2. Switch between sessions from chat history.
3. Delete a session and verify persistence after reload.

## Case 4: Language

1. Switch between `ES` and `EN`.
2. Verify that copy and prompts adapt to the selected locale.

## Case 5: Disabled or missing flow handling

1. Ask for a workflow that is not currently enabled.
2. Verify that the app responds clearly instead of promising unavailable cards or tools.

## Quick debug

- Check `Network` for `POST /api/chat`.
- Check server logs in the `npm run dev` terminal.
- If a workflow backed by an external service fails, validate the relevant environment variables and upstream connectivity.
