# T15 Meta-Review — Frontend API Integration

**Commit:** `afc544d4474140606b1f8f88d30c9af9f9b28349` ("T15: Frontend API Integration")
**Repo:** `/Users/Slava/fueling_chat_front` (branch `final`, working tree clean at review time)
**Reviewed:** `src/api/chat.ts`, `src/api/chat.test.ts` (only files in the diff), plus current state of `src/App.tsx`, `src/types.ts`, `eslint.config.js`, `.env.example`.

## 1. Invariants

| Invariant | Result |
|---|---|
| `pnpm build && pnpm lint && pnpm test` exit 0 | **ok** — build ok, eslint clean, 4 test files / 21 tests passed |
| ESLint caps (max-lines 300, max-lines-per-function 40, max-depth 3) | **ok** — caps present in `eslint.config.js:18-20`; `chat.test.ts` is 88 lines; all callbacks well under 40 lines; lint passed |
| No default exports for components | **ok** — `no-restricted-syntax` rule (`eslint.config.js:27-33`); `chat.ts`/`chat.test.ts` have no default exports |
| `src/App.tsx` holds no `fetch(` call | **ok** — `grep -n "fetch(" src/App.tsx` → nothing; send flow goes through `sendChat` (`App.tsx:65`) |
| Non-JSON error body falls back to masked status text, never raw SyntaxError | **ok** — `chat.ts:16-20` |
| No streaming/polling primitives (D-7) | **ok** — `grep -rE "EventSource|WebSocket|setInterval" src` → nothing |
| `VITE_API_URL` default `http://localhost:8080` (D-13) unchanged | **ok** — `chat.ts:3` unchanged; `.env.example` documents the default |
| Owned files only | **ok** — diff touches exactly `src/api/chat.ts` and `src/api/chat.test.ts` |

## 2. Logic / correctness

- `chat.ts:13-22` — error branch exactly per scaffold: `response.json()` is wrapped in try/catch; parse failure → `ChatApiError(fallback)` where `fallback = request failed with status ${status}`; parse success → `ChatApiError(body?.error ?? fallback)`. Both `ChatApiError` throws sit **outside** the try, so an error thrown in the try cannot be confused with the mapping result, and no `ChatApiError` can be swallowed by the catch (nothing inside the try throws one).
- Success path (200) and payload construction are untouched; signature `sendChat(request: ChatRequest): Promise<ChatResponse>` and `ChatApiError` export unchanged.
- **Null JSON body** (`json()` resolving to null): handled — `body` is typed `{ error?: string } | null` and accessed via `body?.error`, so no TypeError; null falls back to status text. This is an improvement over the scaffold's literal `body.error ??` and still matches its semantics.
- **Empty-string `error` field**: `"" ?? fallback` yields `""`, so `ChatApiError` carries an empty message. At the App level `errorMessage` (`App.tsx:15-16`) guards with `error.message ?`, rendering the generic "Something went wrong" — no empty bubble. Matches scaffold semantics exactly; acceptable.
- **Raw SyntaxError can never propagate**: the catch swallows any exception from `json()`, including SyntaxError.
- Cross-stack contract check: `ChatResponse { summary, provider, elapsed_ms }` matches frozen CONTRACT-API-002 three-field shape (`types.ts:17-21`); request body matches CONTRACT-API-001 frontend clause (`{prompt, provider}` plus optional `fueling_id`); backend 400/500/502 masked `{"error": ...}` bodies map correctly (project-specification.md:67-73).

## 3. API contract

- `VITE_API_URL ?? "http://localhost:8080"` (D-13) — unchanged.
- `App.tsx` sends `{prompt: trimmed body, provider: activeModel}` via `sendChat` (`App.tsx:65`); provider switch reaches the `provider` field (AppSendFlow test "reflects the active model id in the provider field" passes). `fueling_id` is supported by the client (test case 2) and would be included when the user pins one; App has no pin UI yet, which is contract-compliant (field optional).

## 4. Tests

All 4 scaffold cases present in `src/api/chat.test.ts` with live assertions:
1. **`chat.test.ts:38-55`** — exact URL `http://localhost:8080/chat`, `POST`, `Content-Type: application/json`, `Object.keys(body)` length 2 + deep-equal `{prompt, provider}`.
2. **`chat.test.ts:57-67`** — `fueling_id` present → 3 keys, deep-equal `{prompt, provider, fueling_id}`.
3. **`chat.test.ts:69-77`** — 502 JSON `{error: "Provider unreachable"}` → rejects with `ChatApiError` carrying exactly that message.
4. **`chat.test.ts:79-87`** — non-JSON body (stubbed `json()` rejects with `SyntaxError`) → `ChatApiError` with `request failed with status <n>` (parametrized 500/503), plus explicit `expect(error).not.toBeInstanceOf(SyntaxError)`.

Isolation: `fetch` stubbed via `vi.stubGlobal` / restored via `vi.unstubAllGlobals` in `afterEach`; no real network in any test (AppSendFlow tests also stub globally). `rejectionOf` helper fails loudly if `sendChat` resolves unexpectedly.

**Observations (non-blocking):**
- No test for a JSON error body *without* an `error` field → fallback, nor for a null JSON body → fallback (null case verified by inspection: `body?.error ?? fallback` is null-safe). Neither is required by the scaffold's 4 cases.
- `chat.test.ts:11-12` helper stubs cast with `as Response` (partial object casts) — idiomatic for this suite and safe because `sendChat` only touches `ok`, `status`, `json`.

## 5. Verification run

```
export PATH="/Users/Slava/.local/node/bin:$PATH" && cd /Users/Slava/fueling_chat_front
pnpm build  -> exit 0 (tsc --noEmit + vite build, 24 modules)
pnpm lint   -> exit 0
pnpm test   -> exit 0 (4 files, 21 tests, vitest 5.0.4, jsdom)
```

`git status` clean — the run reflects exactly commit `afc544d`.

## Findings

No violations. All invariants, contract points, and acceptance criteria checked and passing.

VERDICT: PASS
