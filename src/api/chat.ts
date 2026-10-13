import type { ChatRequest, ChatResponse } from "../types"

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8080"

export class ChatApiError extends Error {}

export async function sendChat(request: ChatRequest): Promise<ChatResponse> {
  const body = {
    prompt: request.prompt,
    provider: request.provider,
    ...(request.fueling_id ? { fueling_id: request.fueling_id } : {}),
  }

  const response = await fetch(`${apiUrl}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    let message = `request failed with status ${response.status}`
    try {
      const errorBody = (await response.json()) as { error?: string }
      if (errorBody.error) message = errorBody.error
    } catch {
      // Non-JSON error body (e.g. a proxy's HTML page): keep the masked status
      // fallback and never surface the raw parse error to the UI.
    }
    throw new ChatApiError(message)
  }

  return (await response.json()) as ChatResponse
}
