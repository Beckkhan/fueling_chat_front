# T09 — Correctness Review

**Verdict:** pass
**Timestamp:** 2026-10-12T22:05:00Z

## Acceptance criteria check

- [x] `api/chat.ts` POSTs `{prompt, provider}` (plus `fueling_id` when provided) as `application/json`; `ChatRequest`/`ChatResponse` in `types.ts` match CONTRACT-API-001/002 field-for-field (`prompt` required, `fueling_id?`, `provider?`; the 200 response has exactly `summary`, `provider`, `elapsed_ms`). Payload asserted field-for-field in `AppSendFlowTest` (`JSON.parse(options.body)` deep-equal, no `fueling_id` when absent).
- [x] Base URL from `VITE_API_URL` with default `http://localhost:8080` (D-13) — the fetch URL is asserted to be `http://localhost:8080/chat` under test; the tracked frontend `.env.example` already documents `VITE_API_URL=http://localhost:8080` (committed in the spec phase, unchanged).
- [x] Send flow: optimistic user bubble → `POST /chat` → assistant bubble from `summary`; `provider` reflects the active model id — both `local` (default) and `remote` (after switching) payloads are test-verified with mocked `fetch`.
- [x] Non-200 responses render the masked `{"error": …}` body in a muted error bubble; mocked tests cover the `400`, `500` and `502` shapes from CONTRACT-API-002's error table (muted styling asserted: `bg-[#f4f2ed]` + `text-[#929996]`, left-aligned). A non-ChatApiError failure renders a generic muted bubble instead of leaking internals.
- [x] Exactly one POST per send (fetch mock asserted `toHaveBeenCalledTimes(1)`) and no streaming/polling primitives: `grep -rE "EventSource|WebSocket|setInterval" src` returns nothing (D-7).
- [x] `pnpm build`, `pnpm lint`, `pnpm test` all exit 0 (16 tests across 3 files); Prettier check clean.

## Findings

1. **`fueling_id` is client-supported, not UI-exposed** (by design): the mockup (G-1 source of truth) has no pin control, so the UI never sends `fueling_id` — the client type carries the optional field per CONTRACT-API-001 and includes it whenever a caller provides one. Wiring a pin UI would violate mockup parity.
2. **Error bubble is a design-sanctioned extension** (informational): the mockup has no error bubble; design §5 specifies "on error, a muted error bubble". The `Message` component gained an `error` role with muted styling; the user/assistant class strings are untouched (parity diff still 38/38).
3. **Generic failure fallback** (informational): a network failure (fetch rejection) renders "Something went wrong" — never the raw error object — preserving the masked-message contract from the frontend side.

## Verdict

`T09 done | verified: ok`
