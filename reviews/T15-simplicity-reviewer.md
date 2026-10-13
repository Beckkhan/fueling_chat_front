# T15 — Simplicity Reviewer

**Verdict:** PASS
**Timestamp:** 2026-10-13T18:57:15Z

## Scope

Commit `ae4a968` ("T15: Frontend API Integration", frontend repo, 4 files: `src/App.tsx` comments-only, `src/AppSendFlow.test.tsx` +1 test, `src/api/chat.test.ts` new, `src/api/chat.ts` runtime change) on branch `second`, reviewed against `docs/tasks/T15.md` and its acceptance criteria. Gates 1–2 are PASS (`reviews/T15-test-engineer.md`, `reviews/T15-correctness-reviewer.md`). Working tree matches the commit (only untracked files are the two prior review files). Only file with a runtime change is `src/api/chat.ts`; the `src/App.tsx` diff is comments-only (verified: all added lines are `//`), which bounds what the implementer could have changed in this pipeline.

## Verification performed

- Re-ran the acceptance chain `pnpm build && pnpm lint && pnpm test` (PATH=/Users/Slava/.local/node/bin) → whole chain exit 0; 4 files / 24 tests passed.
- Re-ran the AC greps: `grep -n "fetch(" src/App.tsx` → nothing; `grep -rE "EventSource|WebSocket|setInterval" src` → nothing.
- `grep -rn "API_BASE_URL|ChatApiError"` across `src` — every export has a real use; no unused symbols introduced. `src` has no `TODO`/`FIXME`/`XXX` leftovers.
- Read the full diff and the resulting `src/api/chat.ts`, `src/App.tsx`, `src/types.ts`, and both test files.

## Simplicity checks

- **YAGNI:** the diff implements exactly the acceptance criteria — exact `{prompt, provider}` payload, conditional `fueling_id`, masked error mapping, `provider` from `activeModel`, no streaming/polling. No speculative features, no new dependencies, no new config layer. The `fueling_id` branch exists because the AC requires it; the App-level comment explicitly documents that no pin UI or App state is added for it (correct minimal reading).
- **Dead code:** none. `API_BASE_URL` (used internally at `chat.ts:38` and by the test anchor), `ChatApiError` (thrown at `chat.ts:57`, caught in `App.tsx:61`), `sendChat` (called at `App.tsx:43`) all have live consumers. All imports in every changed file are used.
- **Duplication:** the two masked-message literals each live in exactly one production site (`request failed with status <n>` in `chat.ts:48`, `Something went wrong` in `App.tsx:61`); test literals asserting them are not duplication.
- **Over-abstraction:** none — one module-level const, one error class, one function. The payload rebuild (`const body: ChatRequest = {prompt, provider}` then conditional `fueling_id`) is not over-engineering: it is the mechanism enforcing the "exactly `{prompt, provider}`" AC against extra runtime properties, in 4 lines.
- **Fallback-masking logic:** the try/catch + mutable `message` + `typeof` guard is explicit and reads as a direct encoding of the AC ("non-JSON body falls back to masked status text"). A compressed variant (`await response.json().catch(() => null)` + optional chaining) would save ~4 lines but is a lateral readability move, not a clear simplification, and would still need the same comment. Judged acceptable as written.

## Findings (all non-blocking observations; nothing requires change)

1. **`API_BASE_URL` export is test-only surface (architect-pinned).** Its only external consumer is the near-tautological anchor `expect(typeof API_BASE_URL).toBe("string")` in `chat.test.ts:37`; the D-13 default is already asserted live through the fetch URL in the payload test. A non-exported const plus dropping the anchor line would be marginally leaner. Non-blocking: the export is scaffold-pinned (outside what the implementer could change), it is genuinely used, and it has zero runtime cost. Candidate for a later cleanup pass, not for T15.
2. **`ChatApiError` constructor sets `this.name`.** Never asserted, and one line of the three-line constructor exists only to label the class in stack traces/devtools. Conventional and inert; removing it would also change the error label in logs. Non-blocking.
3. **Near-tautological anchor assertion** (`ChatApiError.prototype instanceof Error`, `chat.test.ts:39`). It is a live surface anchor, not dead code; test-strength is gate-1's domain and gate 1 passed it as harmless. Non-blocking.
4. **`App.tsx` comment block is heavy relative to code** (12 comment lines around a 3-line call). The comments carry contract traceability (CONTRACT-API-001/UI-002, D-9/D-10, G-1) and justify deliberate non-actions (no pin state, no markup change). Comments add no runtime or dead code; acceptable in this contract-driven repo. Non-blocking.
5. **Small cross-file test fixture overlap** (`okResponse` helpers in `AppSendFlow.test.tsx` / `App.test.tsx` vs `okBody` / `jsonResponse` in `chat.test.ts`). Different shapes serving different stubs; extracting a shared factory for a handful of use sites would be worse (over-abstraction). Accept as is.
6. **Pre-existing `vi.unstubAllGlobals()` inside the "sends on Enter" test body in `App.test.tsx`** — present before this commit (T09-era), outside the T15 diff. Out of scope for this gate; already noted non-blocking by gate 1.

No blocking findings: no unnecessary interfaces, no duplicated production logic, no dead code, no YAGNI violations within the implementer's change surface.

## Verdict

`T15-simplicity-reviewer: PASS | verified: ok`
