import type { ChatRequest, ChatResponse } from "../types"

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8080"

export class ChatApiError extends Error {}

export async function sendChat(request: ChatRequest): Promise<ChatResponse> {
  const response = await fetch(`${apiUrl}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    const body = (await response.json()) as { error?: string }
    throw new ChatApiError(body.error ?? `request failed with status ${response.status}`)
  }
  return (await response.json()) as ChatResponse
}
