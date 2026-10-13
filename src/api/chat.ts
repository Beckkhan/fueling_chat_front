import type { ChatRequest, ChatResponse } from "../types"

/**
 * Backend base URL (D-13). Vite injects VITE_API_URL at build time; when unset,
 * the contract default below. Documented in the tracked .env.example.
 */
export const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:8080"

/**
 * Typed error for a failed /chat call (CONTRACT-UI-002 error masking).
 *
 * `message` is the only field the App-level error bubble renders, so it always
 * carries display-safe text:
 * - non-200 JSON body `{ "error": "<masked message>" }` → that message verbatim;
 * - non-JSON error body (response.json() rejects) → the masked status fallback
 *   `request failed with status <n>`; the raw SyntaxError never escapes;
 * - JSON body without an `error` field → the same masked status fallback.
 */
export class ChatApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ChatApiError"
  }
}

/**
 * POST /chat client: CONTRACT-API-001 request → CONTRACT-API-002 response.
 * One plain request/response per message (D-7: no streaming, no polling).
 */
export async function sendChat(request: ChatRequest): Promise<ChatResponse> {
  // CONTRACT-API-001: exactly {prompt, provider}, plus `fueling_id` only when
  // the caller pinned one (D-9 — an explicit field, never parsed from the prompt).
  const body: ChatRequest = { prompt: request.prompt, provider: request.provider }
  if (request.fueling_id) {
    body.fueling_id = request.fueling_id
  }

  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    // CONTRACT-UI-002: error bodies are masked. Read the body once; a non-JSON
    // body (or a JSON body without a string `error` field) keeps the masked
    // status fallback instead of surfacing a raw parse error.
    let message = `request failed with status ${response.status}`
    try {
      const parsed = (await response.json()) as { error?: unknown } | null
      if (parsed && typeof parsed.error === "string") {
        message = parsed.error
      }
    } catch {
      // Non-JSON error body: keep the masked status fallback; the SyntaxError never escapes.
    }
    throw new ChatApiError(message)
  }

  // CONTRACT-API-002: exactly {summary, provider, elapsed_ms}.
  return (await response.json()) as ChatResponse
}
