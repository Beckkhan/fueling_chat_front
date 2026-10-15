import type { ChatRequest, ChatResponse } from "../types"

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8080"

export class ChatApiError extends Error {}

/**
 * Network-level failure: the browser could not reach the backend at all (fetch rejects with a
 * TypeError / "Failed to fetch"), as opposed to a backend API error (HTTP 4xx/5xx with an error body).
 */
export class BackendUnavailableError extends Error {}

export const BACKEND_UNAVAILABLE_MESSAGE =
  "Backend service is unavailable. Start the backend (./gradlew run in fueling_chat_backend) and retry."

const isNetworkFailure = (error: unknown): boolean =>
  error instanceof TypeError || (error as Error | null)?.message === "Failed to fetch"

export async function sendChat(request: ChatRequest): Promise<ChatResponse> {
  let response: Response
  try {
    response = await fetch(`${apiUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    })
  } catch (error) {
    if (isNetworkFailure(error)) {
      throw new BackendUnavailableError(BACKEND_UNAVAILABLE_MESSAGE)
    }
    throw error
  }
  if (!response.ok) {
    const fallback = `request failed with status ${response.status}`
    let body: { error?: string } | null = null
    try {
      body = (await response.json()) as { error?: string } | null
    } catch {
      throw new ChatApiError(fallback)
    }
    throw new ChatApiError(body?.error ?? fallback)
  }
  return (await response.json()) as ChatResponse
}
