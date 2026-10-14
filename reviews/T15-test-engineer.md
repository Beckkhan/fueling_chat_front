# T15 — Test Engineer Review (first quality gate)

**Target:** `a0a5d79d460262ee18d4d037c1f267137737df1d` ("T15: integrate Frontend API Integration"), diff vs parent `b576ae0`, frontend repo `/Users/Slava/fueling_chat_front` (branch `third`, HEAD == target, working tree clean).

## Verdict: PASS

Timestamp: 2026-10-14T00:41:37Z (2026-10-14 03:41 MSK)

## Gate criteria — verified

| Gate item | Evidence | Result |
|---|---|---|
| Payload exactly `{prompt, provider}` | `src/api/chat.test.ts:62` (`expectPostedJson` → `toEqual` + `not.toHaveProperty("fueling_id")`); `src/AppPinFlow.test.tsx:63-64` (`toEqual({prompt, provider})`, `"fueling_id" in unpinned === false`); `src/AppSendFlow.test.tsx:50-53` | PASS |
| `+ fueling_id` when pinned | `src/AppPinFlow.test.tsx:70-74` (pin via FuelingPin, exact `{prompt, provider, fueling_id: "F-10001"}`); `src/api/chat.test.ts:80-91` | PASS |
| `VITE_API_URL` base, D-13 default `http://localhost:8080` | `src/api/chat.test.ts:110`, `src/AppPinFlow.test.tsx:36`, `src/AppSendFlow.test.tsx:47` assert `http://localhost:8080/chat`; repo `.env` is empty (0 bytes, untracked), so the D-13 default branch in `src/api/chat.ts:4` is the path exercised; `.env.example` documents D-13 | PASS |
| Non-JSON error fallback never surfaces SyntaxError | `src/api/chat.ts:24-42` reads body once via `text()` and try/catches `JSON.parse`; `src/api/chat.test.ts:118-131` stubs `json()` to throw SyntaxError and asserts `instanceof ChatApiError`, `not instanceof SyntaxError`, message `"request failed with status 502"` | PASS |
| Muted network-failure bubble (CONTRACT-UI-002) | `src/AppPinFlow.test.tsx:76-87`: rejected fetch → `"Something went wrong"` bubble with `bg-[#f4f2ed]` + `text-[#929996]` (muted error role per `src/components/Message.tsx:27`), raw `"Failed to fetch"` never rendered; App-level 400/500/502 masked bodies remain covered in `src/AppSendFlow.test.tsx:90-104` | PASS |
| No real network (fetch stubbed at the boundary) | Every call path stubs global `fetch` via `vi.stubGlobal`: `src/api/chat.test.ts:48-51` + `beforeEach:58`, `src/AppPinFlow.test.tsx:38-39/43`, `src/AppSendFlow.test.tsx:27-28`, `src/App.test.tsx:69`. No `XMLHttpRequest`/`sendBeacon` in `src/` | PASS |
| Isolated / deterministic | `vi.unstubAllGlobals()` in `afterEach` (chat.test, AppPinFlow, AppSendFlow), global `cleanup()` in `src/test/setup.ts`; no shared mutable state, no sleeps/timers, no time-dependent assertions (time strings rendered but never asserted); `vitest run --sequence.shuffle` green 3/3 runs | PASS |
| `pnpm test` passes | `vitest run`: **5 files / 23 tests passed** (1.73s), repeated runs stable. `pnpm build` exit 0, `pnpm lint` exit 0 | PASS |

## Checks

- `grep -n "fetch(" src/App.tsx` → no hits (send flow uses `sendChat` from `src/api/chat.ts`).
- `grep -rE "EventSource|WebSocket|setInterval" src` → no hits (D-7).
- No `.only` / `.skip` / `.todo` / `.fails` in any `*.test.*` — nothing silently skipped.
- Assertions are exact (`toEqual`) on parsed JSON bodies, so extra fields would fail; `JSON.parse` is fed from `options.body` (real serialization), not a pre-parsed object.
- Integration fix in diff (`src/AppSendFlow.test.tsx:17` adds `text()` to the error fixture) is test-only and matches the real `Response` surface; assertions unchanged.
- Existing suites stay green: App default-provider (`local`, D-10) and provider-switch (`remote`) assertions in `src/AppSendFlow.test.tsx:35-88` pass.

## Observations (non-blocking, follow-up candidates)

1. `src/components/FuelingPin.tsx` (new): the pin path is covered end-to-end via `AppPinFlow.test.tsx`, but the **unpin** path (`onChange(null)`, `FuelingPin.tsx:20-21`) and the whitespace-only guard (`FuelingPin.tsx:31-34`) have no direct test. T15's acceptance criteria and Scaffold Block D scope exactly two App-level tests, both present, so this does not fail the gate.
2. `okResponse` helpers omit `text()`; harmless because the 200 path only calls `json()`.
