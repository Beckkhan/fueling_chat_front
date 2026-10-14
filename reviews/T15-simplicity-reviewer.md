# T15 — Simplicity Review

**Target:** `a0a5d79d460262ee18d4d037c1f267137737df1d` (frontend repo, branch `third`), diff vs parent `b576ae0`
**Verdict:** PASS
**Timestamp:** 2026-10-14T00:40:49Z

## Findings

No blocking findings. All findings below are non-blocking observations.

1. **Test-double helpers duplicated across the three mandated test files (non-blocking).**
   `okResponse` appears three times: `src/AppPinFlow.test.tsx:5-10`, `src/AppSendFlow.test.tsx:5-10`, `src/api/chat.test.ts:5-11`; the `send` helper twice: `src/AppPinFlow.test.tsx:14-18` and `src/AppSendFlow.test.tsx:20-24`; the POST-envelope assertions (`url`/method/`Content-Type`/body) three times: `src/AppPinFlow.test.tsx:25-32`, `src/AppSendFlow.test.tsx:45-53`, `src/api/chat.test.ts:39-50`. This duplication is inherent to the scaffold's per-block ownership map (separate files, "no new files" artifact list); extracting a shared `src/test/` helper would add a file outside the mandated artifacts. Accepted as-is.
2. **Unused members on `as Response` mock literals (nit).** `src/api/chat.test.ts:10` (`text` on `okResponse`) is never reached on the success path, and its `?? ""` guard is unreachable; `src/api/chat.test.ts:17` (`json` on `jsonErrorResponse`) and `src/AppSendFlow.test.tsx:16` (`json` on `errorResponse`) are dead now that `chat.ts` reads error bodies via `response.text()`. These are inert members of test doubles (TypeScript sees the `as Response` cast), not runtime dead code; in `nonJsonErrorResponse` the throwing `json` at `chat.test.ts:26-28` is deliberate — it proves the client never calls `json()` on the error path. Optional cleanup only.
3. **Near-identical button class strings (nit).** `src/components/FuelingPin.tsx:19` and `:59` repeat the same Tailwind utility string (differing only in `disabled:` utilities). Hoisting a constant would be marginally DRY-er but matches the codebase's existing Tailwind idiom (e.g. `src/components/Composer.tsx:45` carries its own variant).

## Notes

- **YAGNI:** the diff adds exactly the task-mandated behavior and nothing more — `fuelingId` state, the `fueling_id: fuelingId ?? undefined` payload field, and the `FuelingPin` mount in `App.tsx`; the single-read error-body fallback in `chat.ts`; the pin/unpin control in `FuelingPin.tsx` (task-mandated, including the frozen `FuelingPinProps` interface). No settings, persistence, validation, or UI beyond the acceptance criteria.
- **No unnecessary abstractions:** `ChatApiError` (empty `extends Error`) and `FuelingPinProps` are frozen by the scaffold's cross-block interfaces. The internal `PinForm` (FuelingPin.tsx:32-66) is a small, justified split — it keeps draft state out of the pinned branch so a stale draft cannot survive an unpin.
- **No dead code left behind:** no `TODO(Block …)` markers remain anywhere under `src/`; every new import/export is referenced (`ChatApiError`, `sendChat`, `FuelingPin`, `FuelingPinProps`, `PinForm`, `useState`).
- **Diff scope:** 6 files, all from the scaffold's OWNERSHIP map; no unrelated changes, no new dependencies. `AppSendFlow.test.tsx`'s one-line addition (`text()` on the error fixture) is the minimal integration fix for the client's single-read error path.
