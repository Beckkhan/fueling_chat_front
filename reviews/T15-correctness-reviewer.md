# T15 — Correctness Review (second quality gate)

**Verdict:** PASS
**Timestamp:** 2026-10-14T00:41:58Z
**Target:** frontend repo `/Users/Slava/fueling_chat_front`, commit `a0a5d79d460262ee18d4d037c1f267137737df1d` (diff vs parent `b576ae0a6789a1082b34165be89bab779105a229`), branch `third`. Working tree clean.

## Gate checks

1. **Payload = exactly CONTRACT-API-001 fields** — PASS.
   `src/App.tsx:43-47` builds `{prompt, provider, fueling_id: fuelingId ?? undefined}`; `JSON.stringify` drops `undefined`, so an unpinned send serializes to exactly `{"prompt":…,"provider":…}`. Pinned id is trimmed and only set when non-empty (`src/components/FuelingPin.tsx:22-26`), replaceable/unpinnable back to `null`. Verified by tests: `src/api/chat.test.ts:70-96` (`not.toHaveProperty("fueling_id")` + exact `toEqual`), `src/AppPinFlow.test.tsx:57-69` (`"fueling_id" in unpinned === false`; pinned body `toEqual({prompt, provider, fueling_id:"F-10001"})`).
2. **Provider switcher sends the active model id, local default (D-10)** — PASS.
   `src/App.tsx:11` default `"local"`; `src/App.tsx:45` sends `provider: activeModel`; `ModelSwitcher` puts the `ModelId` (`local`/`remote`, `src/types.ts:2`) straight into `onChange` (`src/components/ModelSwitcher.tsx:68-71`). `src/AppSendFlow.test.tsx:74-88` asserts the `remote` payload after switching; default-local asserted at `src/AppSendFlow.test.tsx:50-53`.
3. **No `fetch(` left in App.tsx** — PASS. `grep -n "fetch(" src/App.tsx` → no hits; the only `fetch` in `src/` is the client call at `src/api/chat.ts:13`.
4. **Non-JSON error bodies never surface a raw SyntaxError** — PASS.
   `src/api/chat.ts:23-39` reads the non-2xx body once via `response.text()`, parses inside `try/catch`, accepts `error` only when it is a non-empty string, else throws `ChatApiError("request failed with status <n>")`. `src/api/chat.test.ts:123-131` feeds an HTML 502 body and asserts `instanceof ChatApiError`, `not.toBeInstanceOf(SyntaxError)`, message `"request failed with status 502"`; `src/AppPinFlow.test.tsx:73-86` asserts a rejected fetch renders the generic `"Something went wrong"` (never the raw message). The JSON-error path is covered for 400/500/502 in `src/api/chat.test.ts:108-121` and at App level in `src/AppSendFlow.test.tsx:90-104`.
5. **Muted error bubble per CONTRACT-UI-002** — PASS.
   App catch maps `ChatApiError.message` (masked) else the generic text, with `role: "error"` (`src/App.tsx:57-71`); `src/components/Message.tsx:27` renders the error role as the muted bubble (`bg-[#f4f2ed] text-[#929996]` + border), matching design §5 "on error, a muted error bubble". Asserted in `src/AppSendFlow.test.tsx:100-102` and `src/AppPinFlow.test.tsx:80-82`.
6. **No streaming/polling primitives (D-7)** — PASS. `grep -rEn "EventSource|WebSocket|setInterval|setTimeout" src/` → no hits; one request/response per send (`fetchMock` called exactly once, asserted in tests).
7. **No credentials** — PASS. No `Authorization`/key/token/secret material anywhere in `src/` or configs (only false positives: the word "tokens" in a palette comment, `"token"` in a test SyntaxError string); no `.env` tracked, only `.env.example` with the non-secret default `VITE_API_URL=http://localhost:8080` (D-13).
8. **D-9 (fueling_id branching, frontend side)** — PASS. The client sends the explicit field only when the user pinned one and never attempts client-side extraction from message text; absent-field behaviour is the backend's (extract-or-answer) per spec §2/D-9.
9. **Suite/build verification** — `pnpm test` 5 files / 23 tests pass; `pnpm build` (tsc --noEmit + vite build) exit 0; `pnpm lint` exit 0. `FuelingPin` renders no `<article>` (keeps foundation article-count assertions valid) and its aria labels match the frozen cross-block contract.

## Findings

None blocking.

Non-blocking observations (no gate impact):

1. `src/api/chat.ts:42` — a 200 response with a non-JSON body would throw a raw `SyntaxError` from `response.json()`, a small deviation from the Block A interface note "throws only `ChatApiError` … or the raw network error". It can never surface raw in the UI (App maps any non-`ChatApiError` to `"Something went wrong"`, `src/App.tsx:60-61`) and CONTRACT-API-002 fixes 200 to JSON, so no action required for T15.
2. `src/api/chat.ts:4` — `??` only covers `null`/`undefined`; a deliberately empty `VITE_API_URL` would yield a relative `/chat`. Consistent with the T09-reviewed line and `.env.example` documents a full URL; informational only.

## Verdict

`Verdict: PASS`
