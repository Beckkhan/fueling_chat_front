# T15 — Test Engineer Review

**Verdict:** PASS
**Timestamp:** 2026-10-13T18:52:39Z

## Scope

Commit `ae4a968` ("T15: Frontend API Integration", 4 files: `src/App.tsx`, `src/AppSendFlow.test.tsx`, `src/api/chat.test.ts`, `src/api/chat.ts`) on branch `second`, reviewed against `docs/tasks/T15.md` (backend repo) and CONTRACT-API-001 / CONTRACT-UI-002 (spec §2 request/error bodies + design §5 muted error bubble + D-13; INDEX.md mapping). Working tree is clean and matches the commit for all reviewed paths (verified with `git status --short`).

## Verification performed

- Ran the exact acceptance chain `pnpm build && pnpm lint && pnpm test` — exit 0. `tsc --noEmit` + `vite build` succeed; `eslint .` clean; `vitest run`: 4 files, 24 tests, 24 passed, 0 failed, 0 skipped, 0 todo (matches the implementer's 24/0/0 claim; the 7 scaffold `it.todo` recipes from `api/chat.test.ts` are all real tests now, plus the live anchor).
- Flakiness re-runs: 3x consecutive `pnpm test` all green, plus `vitest run --sequence.shuffle` — 24/24 green. No sleeps, no fake timers, no wall-clock or randomness-dependent assertions; all mocks resolve deterministically.
- Read the full diff and both test files. App-level tests stub the global `fetch` and render the real `App` + real `sendChat` (no module-level mocking of the client), so the whole App → api/chat.ts → fetch chain is exercised.
- Mutation checks (temp edits, reverted via `git checkout`; tree confirmed clean afterwards) to prove the tests are non-vacuous:
  1. Hardcoded `API_BASE_URL` to the default, ignoring `VITE_API_URL` → "uses the custom VITE_API_URL when set" fails. This also proves the `vi.stubEnv` + `vi.resetModules` + dynamic-import mechanism genuinely re-evaluates the module (the test passes only when the env stub reaches `import.meta.env`).
  2. Removed the try/catch fallback in the error branch (let `response.json()` rejections escape) → both fallback tests fail. A raw `SyntaxError` leak is detected.
  3. Made `App.tsx` always send `provider: "local"` → "reflects the active model id in the provider field" fails. Provider wiring is genuinely asserted.
- Isolation audit: `chat.test.ts` cleans up with `afterEach: vi.unstubAllGlobals() + vi.unstubAllEnvs() + vi.resetModules()`; `AppSendFlow.test.tsx` cleans up with `afterEach: vi.unstubAllGlobals()`; the shared setup (`src/test/setup.ts`) runs `cleanup` after each test. `fetch` mocks are test-local; no shared mutable state; no `beforeEach` carries state across tests. The env-stub test intentionally re-imports a fresh module copy while the top-level anchor import stays bound to the load-time instance — a mutable-state-free pattern (module-level `API_BASE_URL` is a `const`; no test mutates module state), confirmed stable under shuffled order and Vitest's default per-file isolation.
- Network audit: every test that reaches `sendChat` stubs `fetch` first (chat.test.ts per test; AppSendFlow.test.tsx `beforeEach`; App.test.tsx "sends on Enter" stubs locally). Tests that never send (render/mockup tests) cannot reach fetch. No real socket is opened.
- AC greps run exactly as specified: `grep -n "fetch(" src/App.tsx` → no output (exit 1; only `src/api/chat.ts:38` calls `fetch`); `grep -rE "EventSource|WebSocket|setInterval" src` → no output (exit 1).

## Acceptance criteria check (test view)

- [x] **No `fetch(` in App.tsx**: grep returns nothing; send flow goes through `sendChat` from `api/chat.ts`. Covered end-to-end by the real-client App tests.
- [x] **Payload contract**: `posts exactly {prompt, provider} as application/json…` asserts `method: POST`, `headers["Content-Type"] === "application/json"`, `JSON.parse(body)` `toEqual` exactly `{prompt, provider}` (toEqual, not toMatchObject — extra keys would fail) and the request URL `http://localhost:8080/chat` (D-13 default). The `fueling_id` test asserts exactly the 3-key shape when pinned. The custom-base test stubs `VITE_API_URL=https://api.example.test` and asserts `https://api.example.test/chat`.
- [x] **Error handling (CONTRACT-UI-002)**: non-200 JSON `{error}` → `ChatApiError` with the masked message verbatim (asserted instance + message); non-JSON body → `ChatApiError("request failed with status 502")` and explicitly `not.toBeInstanceOf(SyntaxError)` — no raw SyntaxError leak, covered by a test; JSON body without a string `error` field → same status fallback. App-level bubble: `it.each` over 400/500/502 JSON shapes asserts the exact message text and the muted classes `bg-[#f4f2ed]` / `text-[#929996]`; fetch rejecting with `TypeError` renders the generic "Something went wrong" in the same muted bubble. `Message.tsx`'s error role applies those classes, matching design §5 / the mockup palette.
- [x] **Provider switching**: default `local` is asserted in the first send-flow test; after switching to Remote the payload carries `provider: "remote"` (mutation-verified). Existing send-flow tests stay green.
- [x] **No streaming/polling**: `grep -rE "EventSource|WebSocket|setInterval" src` returns nothing (D-7).
- [x] **`pnpm build && pnpm lint && pnpm test` exit 0**: verified as a single chained command.

## Observations (non-blocking)

1. The non-JSON error body is covered at the client level (`chat.test.ts`) while App-level tests cover JSON bodies and network failure; the full non-JSON-502 → App bubble chain is covered by composition (App renders `ChatApiError.message` verbatim, asserted for other messages). A direct App-level non-JSON test would be marginally stronger but the AC's "covered by a test" is satisfied.
2. Pre-existing `src/App.test.tsx` "sends on Enter…" (outside this commit) calls `vi.unstubAllGlobals()` inside the test body instead of an `afterEach`; a mid-test failure would leave the stub in place for later tests in that file (which do not call fetch, so no practical leak). Hygiene only — not part of the T15 diff.
3. The scaffold anchor assertion `ChatApiError.prototype instanceof Error` is near-tautological; harmless as a surface anchor.
4. `waitFor(() => … toHaveValue(""))` in AppSendFlow is immediately true (the input clears synchronously on send) — harmless and deterministic.

## Verdict

`T15-test-engineer: PASS | verified: ok`
