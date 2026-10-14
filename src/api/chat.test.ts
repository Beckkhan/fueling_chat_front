import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { ChatRequest } from "../types"
import { ChatApiError, sendChat } from "./chat"

const okResponse = (body: unknown): Response =>
  ({
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body) ?? "",
  }) as Response

const jsonErrorResponse = (status: number, error: string): Response =>
  ({
    ok: false,
    status,
    json: async () => ({ error }),
    text: async () => JSON.stringify({ error }),
  }) as Response

// A real non-JSON error body (e.g. a proxy HTML page): reading it must never surface a raw SyntaxError.
const nonJsonErrorResponse = (status: number): Response =>
  ({
    ok: false,
    status,
    json: async (): Promise<unknown> => {
      throw new SyntaxError("Unexpected token < in JSON")
    },
    text: async () => "<html><body>Bad Gateway</body></html>",
  }) as Response

function stubFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

function expectPostedJson(
  fetchMock: ReturnType<typeof stubFetch>,
  expected: Record<string, unknown>,
): Record<string, unknown> {
  expect(fetchMock).toHaveBeenCalledTimes(1)
  const [url, options] = fetchMock.mock.calls[0]
  expect(url).toBe("http://localhost:8080/chat")
  expect(options.method).toBe("POST")
  expect(options.headers["Content-Type"]).toBe("application/json")
  const body = JSON.parse(options.body) as Record<string, unknown>
  expect(body).toEqual(expected)
  return body
}

async function catchSendChatError(request: ChatRequest): Promise<Error> {
  try {
    await sendChat(request)
  } catch (error) {
    return error as Error
  }
  throw new Error("sendChat should have rejected")
}

describe("sendChat", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("posts exactly {prompt, provider} to the VITE_API_URL base", async () => {
    const fetchMock = stubFetch(okResponse({ summary: "Done", provider: "local", elapsed_ms: 12 }))

    await sendChat({ prompt: "What do we know about fueling F-10001?", provider: "local" })

    const body = expectPostedJson(fetchMock, {
      prompt: "What do we know about fueling F-10001?",
      provider: "local",
    })
    expect(body).not.toHaveProperty("fueling_id")
  })

  it("includes fueling_id when the request carries one", async () => {
    const fetchMock = stubFetch(okResponse({ summary: "Done", provider: "local", elapsed_ms: 12 }))

    await sendChat({
      prompt: "What do we know about fueling F-10001?",
      provider: "local",
      fueling_id: "F-10001",
    })

    expectPostedJson(fetchMock, {
      prompt: "What do we know about fueling F-10001?",
      provider: "local",
      fueling_id: "F-10001",
    })
  })

  it("returns the frozen {summary, provider, elapsed_ms} shape on 200", async () => {
    const payload = { summary: "F-10001 completed", provider: "local", elapsed_ms: 12 }
    stubFetch(okResponse(payload))

    const response = await sendChat({ prompt: "Tell me about F-10001", provider: "local" })

    expect(response).toEqual(payload)
    expect(Object.keys(response).sort()).toEqual(["elapsed_ms", "provider", "summary"])
  })

  it("throws ChatApiError with the masked error message for JSON error bodies", async () => {
    for (const [status, masked] of [
      [400, "Bad request"],
      [500, "Databases unavailable"],
      [502, "Provider unreachable"],
    ] as const) {
      stubFetch(jsonErrorResponse(status, masked))

      const error = await catchSendChatError({ prompt: "Hello", provider: "local" })

      expect(error).toBeInstanceOf(ChatApiError)
      expect(error.message).toBe(masked)
    }
  })

  it("falls back to a masked status text for non-JSON error bodies — never a raw SyntaxError", async () => {
    stubFetch(nonJsonErrorResponse(502))

    const error = await catchSendChatError({ prompt: "Hello", provider: "local" })

    expect(error).toBeInstanceOf(ChatApiError)
    expect(error).not.toBeInstanceOf(SyntaxError)
    expect(error.message).toBe("request failed with status 502")
  })
})
