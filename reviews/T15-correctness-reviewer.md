VERDICT: PASS

# T15 — Correctness Review (Round 2, re-run after handback fix)

**Verdict:** PASS
**Timestamp:** 2026-10-13T15:49:26Z
**Reviewed state:** combined diff vs `4686d6c` — `f88ee6b` (`T15: Frontend API Integration`) + `5b3feb8` (`T15: fix Prettier formatting after review`), HEAD = `5b3feb8`, frontend repo `/Users/Slava/fueling_chat_front`, branch `first`.
**Round 1:** PASS on `f88ee6b` (review of 2026-10-13T15:37:44Z). The code-style gate later failed on Prettier formatting of `src/api/chat.test.ts` (handback 1 in the task file). This round re-verifies the fix commit and confirms the round-1 reasoning on the combined diff.
**Contracts:** CONTRACT-API-001, CONTRACT-UI-002 (spec §2 request/error bodies + design §5 muted error bubble + D-13).
**Input gate:** `reviews/T15-test-engineer.md` — `VERDICT: PASS` (round 2, re-run after fix: `pnpm exec prettier --check src/` clean, `pnpm test` 23/23 green ×2, build/lint EXIT=0 on the combined diff).

## Handback fix verification — `5b3feb8` is formatting-only

Evidence, all independently reproduced:

1. **Single file touched.** `git diff --name-only f88ee6b..HEAD` → `src/api/chat.test.ts` only (+8/−2). `chat.ts`, `App.tsx`, and `AppSendFlow.test.tsx` at HEAD are byte-identical to the round-1 reviewed state, so every round-1 finding and verification below holds verbatim.
2. **The change is a Prettier line-wrap, not a logic edit.** The full commit diff is two identical re-wraps: the `vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: "Bad request" }, false, 400)))` one-liner (old 105 chars, > `printWidth: 100`) and the `jsonResponse({ detail: "hidden" }, false, 500)` one-liner (101 chars) are each split across three indented lines.
3. **Normalized comparison.** Stripping all whitespace from `f88ee6b:src/api/chat.test.ts` vs `5b3feb8:src/api/chat.test.ts`, the only remaining delta is one added `,` before the closing `)` in each of the two re-wrapped calls. That is Prettier's `trailingComma` insertion for a multiline argument list. A trailing comma in a call argument list is ignored by the TS/JS parser and cannot alter runtime behavior, `arguments`, or arity — **no semantic change**. Test titles, payloads, statuses, assertions and the `afterEach` cleanup are untouched.
4. **Working tree.** `git status --porcelain -- src` → clean; HEAD (`5b3feb8`) == reviewed code, aside from untracked `reviews/*.md` files.

## Round-1 verification, re-confirmed on the combined diff

1. **Payload exactly `{prompt, provider}`, `fueling_id` only when pinned (CONTRACT-API-001).** `chat.ts:8-12` builds the body from exactly those keys (arbitrary request properties dropped); the spread adds `fueling_id` only for a pinned non-empty id. `POST` + `application/json` asserted; App call shape `{prompt, provider}` is unchanged.
2. **`provider` = active model id (D-10).** `App.tsx` passes `activeModel` (initial `"local"`, `"remote"` after switching); send-flow test proves the switched id reaches the body.
3. **Non-200 JSON → masked `error` (CONTRACT-UI-002).** Error path reads `response.json()`, uses `error` only when truthy, else falls back to `request failed with status <n>`; App renders only `error.message` in the muted bubble.
4. **Non-JSON error body never surfaces a raw `SyntaxError`.** Broad `try/catch` around `response.json()` keeps the masked status fallback (also absorbs `null` JSON, primitives, non-string `error`); tests assert `ChatApiError`, the exact fallback text, and `not.toBeInstanceOf(SyntaxError)` — the two re-wrapped tests are precisely these two.
5. **App error bubble (muted, 400/500/502 + generic network failure).** `role: "error"` message, masked server text for `ChatApiError` else `"Something went wrong"`; `Message.tsx` muted tokens; `it.each` over the three statuses; new test proves raw `"Failed to fetch"` never renders.
6. **D-13 base URL.** `chat.ts:3` `import.meta.env.VITE_API_URL ?? "http://localhost:8080"`; default and override paths both asserted.
7. **No streaming primitives (D-7).** Independently re-ran `grep -rE "EventSource|WebSocket|setInterval" src` → no matches.
8. **D-9 (frontend side).** Client forwards a pinned `fueling_id` verbatim and never extracts ids from message text; extraction/branching stays server-side.
9. **Masking / secrets.** No credentials anywhere in the diff; only the server's `error` field or the status-only fallback reaches the UI.
10. **AC greps at HEAD.** `grep -n "fetch(" src/App.tsx` → nothing (send goes through `sendChat`).

## Findings

None blocking. Round-1 non-blocking observations carry over unchanged (none affected by the fix):

1. Success-path non-JSON body still throws a raw `SyntaxError` from `sendChat` (only the error path is guarded); the App maps any non-`ChatApiError` to the generic bubble, and the AC/contract concerns non-JSON *error* bodies only.
2. `fueling_id` truthiness: empty-string pin omitted (sane); whitespace-only pin would be forwarded verbatim — no UI pins ids in T15.
3. `??` vs `||` for `VITE_API_URL`: an explicitly empty personal `.env` value defeats the default.
4. Pre-existing (T09): `Date.now()` ids can collide within a millisecond (React key warning worst case); no in-flight guard for rapid sends.
5. **Verification limitation (unchanged from round 1):** no `node`/`pnpm` on PATH in this sandbox, so I could not re-execute build/lint/test or `prettier --check` myself. This round's live evidence is the test-engineer round-2 review (prettier clean, 23/23 green ×2, build/lint EXIT=0); my confirmation is the byte-level / normalized diff proof above, which is sufficient to establish that `5b3feb8` cannot have changed behavior or the test outcomes relative to round 1.

## Verdict

`T15 done | verified: ok` — the handback fix is formatting-only (Prettier re-wrap + trailing comma in `src/api/chat.test.ts`, one file, no semantics), and the round-1 PASS reasoning applies unchanged to the combined diff `4686d6c..5b3feb8`.
