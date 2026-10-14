import type { ChatRequest, ChatResponse } from "../types"

// Keep this base — VITE_API_URL from the env, D-13 default http://localhost:8080.
const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8080"

// Typed client error (CONTRACT-UI-002): the message is ALWAYS masked — either the JSON body's
// `error` field or a status text. A raw SyntaxError must never escape sendChat.
export class ChatApiError extends Error {}

export async function sendChat(request: ChatRequest): Promise<ChatResponse> {
  // POST application/json to `${apiUrl}/chat`; the body is JSON.stringify(request)
  // carrying exactly {prompt, provider} plus fueling_id when pinned (CONTRACT-API-001).
  const response = await fetch(`${apiUrl}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    // Read the error body ONCE as text and try to parse it as JSON:
    //   - {error} present → throw new ChatApiError(error) (masked message);
    //   - non-JSON body / parse failure → throw new ChatApiError(
    //       `request failed with status ${response.status}`) — never surface a raw SyntaxError.
    const body = await response.text()
    let masked: string | undefined
    try {
      const parsed: unknown = JSON.parse(body)
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "error" in parsed &&
        typeof parsed.error === "string" &&
        parsed.error.length > 0
      ) {
        masked = parsed.error
      }
    } catch {
      // Non-JSON error body: fall through to the masked status text.
    }
    throw new ChatApiError(masked ?? `request failed with status ${response.status}`)
  }
  // 200: the frozen {summary, provider, elapsed_ms} shape (CONTRACT-API-002).
  return (await response.json()) as ChatResponse
}
