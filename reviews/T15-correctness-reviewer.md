# T15 — Correctness Reviewer

**Verdict:** PASS
**Timestamp:** 2026-10-13T18:55:45Z

## Scope

Commit `ae4a968` ("T15: Frontend API Integration", frontend repo, 4 files: `src/App.tsx`, `src/AppSendFlow.test.tsx`, `src/api/chat.test.ts`, `src/api/chat.ts`) on branch `second`, reviewed against `docs/tasks/T15.md` (backend repo) and CONTRACT-API-001 / CONTRACT-UI-002 (spec §2, design §5, D-7/D-9/D-10/D-13; INDEX.md mapping). Working tree matches the commit for all reviewed paths; only untracked artifact is the gate-1 review file.

## Verification performed

### Acceptance criteria (re-run, not taken on trust)

- `grep -n "fetch(" src/App.tsx` → no output (exit 1). The only `fetch(` call site in `src` is `src/api/chat.ts:38`; the App send flow (`src/App.tsx:43`) calls `sendChat({ prompt: body, provider: activeModel })`.
- `grep -rE "EventSource|WebSocket|setInterval" src` → no output (exit 1); D-7 respected.
- `pnpm build && pnpm lint && pnpm test` (PATH=/Users/Slava/.local/node/bin) → whole chain exit 0; `vitest run`: 4 files / 24 tests, all passed.

### Payload contract (CONTRACT-API-001, D-9)

- `src/api/chat.ts:33-36` builds a fresh `ChatRequest` with exactly `{prompt, provider}` and adds `fueling_id` only when `request.fueling_id` is truthy. `JSON.stringify` therefore emits exactly 2 keys, or 3 with a non-empty pin — no pass-through of extra runtime properties (the object is rebuilt, not spread), so client-side exactness holds even if a caller supplies extras.
- Empty-string pin is omitted → the backend treats it as absent (D-9 "LLM may extract" branch). This is the safe reading: the backend's `ChatRequest` does not validate `fueling_id` blankness, so forwarding `""` would inject an empty explicit context. Confirmed against `src/main/kotlin/com/fuelingchat/routes/ChatRequest.kt` and `ChatRoutes.kt` (`ignoreUnknownKeys = true`, only `prompt`/`provider` validated).
- `Content-Type: application/json`, `method: POST`, URL `${API_BASE_URL}/chat`.
- `API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080"` (D-13). Default asserted live as `http://localhost:8080/chat` and custom base as `https://api.example.test/chat` (env stub + module re-import). `.env.example` is tracked in the frontend repo and documents `VITE_API_URL=http://localhost:8080`.
- `api/chat.test.ts` asserts both payload shapes with `toEqual` (exact keys, so an extra `fueling_id` in the 2-key case would fail) and the base URL.

### Error handling (CONTRACT-UI-002)

- Non-2xx path (`src/api/chat.ts:44-58`): `response.json()` parsed exactly once inside a try/catch; a JSON body with a string `error` field maps to `ChatApiError` with the masked message verbatim; a `null` body, non-string `error`, or a body whose `json()` rejects (SyntaxError) all keep the masked fallback `request failed with status <n>`; the catch prevents any raw parse error from escaping. This also removes the two pre-existing crash paths: a raw SyntaxError leak, and a TypeError from `body.error` on a JSON `null` body.
- App classification (`src/App.tsx:60-61`): `error instanceof ChatApiError && error.message ? error.message : "Something went wrong"` — masked ChatApiError message verbatim; every other rejection (network `TypeError`) gets the generic message. App tests assert 400/500/502 JSON shapes render their message text verbatim and the `fetch`-reject case renders the generic message, all with the muted bubble classes.
- Muted bubble (design §5): `Message.tsx` role `error` renders `bg-[#f4f2ed]` / `text-[#929996]` / `border-[#e3e1dc]`, left-aligned with the `!` avatar. The Figma export (`/Users/Slava/Desktop/Scandinavian Style Chat Design/src/App.tsx`) has no error-branch markup — the design only mandates "a muted error bubble" — and the tokens used are drawn from that export's own muted palette (`hover:bg-[#f4f2ed]`, meta text `#929996`, assistant border `#e3e1dc`). Mockup-parity check satisfied; these styles pre-date T15 (T08/T09).

### Provider field (D-10)

- `activeModel` state defaults to `"local"`; `ModelSwitcher` ids are exactly `local`/`remote` (design §5: 1:1 with the `provider` field); App passes `provider: activeModel`. Tests assert the default (`provider: "local"`) and `"remote"` after switching.

### Response consumption (CONTRACT-API-002)

- `types.ts` `ChatResponse = {summary, provider, elapsed_ms}` matches the frozen backend `ChatResponse` (verified against the Kotlin DTO); App renders `response.summary` into the assistant bubble. Error bodies consumed as `{"error": "<masked>"}` — matching the backend's `ErrorResponse` and status table (400/500/502).

### Scope and hygiene

- The only runtime change in this commit is `src/api/chat.ts`. The `src/App.tsx` diff is comments-only (verified: all added lines are `//`). No extra API surface, no behavior beyond the contract (the `API_BASE_URL` export and `ChatApiError.name` are the only incidental additions; both inert).
- No credentials or secrets anywhere in the diff; no `console.*`/`debugger`; error text is only the backend's masked field or the generic/status fallback.

## Observations (non-blocking)

1. There is no UI affordance to pin a `fueling_id` (the mockup defines none), so the App can never send it today. The AC is written against `sendChat` and the client handles/tests it correctly; the comment in `App.tsx:37-42` documents this accurately.
2. A 200 response with a non-JSON body would raise a SyntaxError from `response.json()`; it is caught by the App's generic branch, so no raw error reaches the user. Out of contract (200 body is frozen JSON).
3. A backend `{"error": ""}` would map to the generic App message via the `error.message` truthiness guard — defensive; contract-masked messages are non-empty.

## Verdict

`T15-correctness-reviewer: PASS | verified: ok`
