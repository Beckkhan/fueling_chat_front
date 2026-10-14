import { afterEach, describe, expect, it, vi } from "vitest"
import type { ChatRequest, ChatResponse } from "../types"
import { ChatApiError, sendChat } from "./chat"

const chatReply: ChatResponse = { summary: "Done", provider: "local", elapsed_ms: 7 }

const okResponse = () => ({ ok: true, status: 200, json: async () => chatReply }) as Response

const jsonErrorResponse = (status: number, error: string) =>
  ({ ok: false, status, json: async () => ({ error }) }) as Response

const nonJsonErrorResponse = (status: number) =>
  ({
    ok: false,
    status,
    json: async (): Promise<unknown> => {
      throw new SyntaxError("Unexpected end of JSON input")
    },
  }) as Response

const stubFetchResponse = (response: Response) => {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

const rejectionOf = async (request: ChatRequest): Promise<unknown> => {
  try {
    await sendChat(request)
  } catch (error) {
    return error
  }
  throw new Error("expected sendChat to reject")
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("sendChat request body", () => {
  it("POSTs prompt and provider to the VITE_API_URL default base URL", async () => {
    const fetchMock = stubFetchResponse(okResponse())

    const reply = await sendChat({ prompt: "What about F-10001?", provider: "local" })
    expect(reply).toEqual(chatReply)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("http://localhost:8080/chat")
    expect(options.method).toBe("POST")
    expect((options.headers as Record<string, string>)["Content-Type"]).toBe("application/json")
    const body = JSON.parse(options.body as string) as Record<string, unknown>
    expect(Object.keys(body)).toHaveLength(2)
    expect(body).toEqual({ prompt: "What about F-10001?", provider: "local" })
  })

  it("includes fueling_id when the ChatRequest carries one", async () => {
    const fetchMock = stubFetchResponse(okResponse())

    await sendChat({ prompt: "Status?", provider: "local", fueling_id: "F-10001" })

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(options.body as string) as Record<string, unknown>
    expect(Object.keys(body)).toHaveLength(3)
    expect(body).toEqual({ prompt: "Status?", provider: "local", fueling_id: "F-10001" })
  })
})

describe("sendChat error mapping", () => {
  it("rejects with ChatApiError carrying the masked JSON error body", async () => {
    stubFetchResponse(jsonErrorResponse(502, "Provider unreachable"))

    const error = await rejectionOf({ prompt: "Hello", provider: "local" })

    expect(error).toBeInstanceOf(ChatApiError)
    expect((error as Error).message).toBe("Provider unreachable")
  })

  it.each([500, 503])("maps a non-JSON %i error body to masked status text", async (status) => {
    stubFetchResponse(nonJsonErrorResponse(status))

    const error = await rejectionOf({ prompt: "Hello", provider: "local" })

    expect(error).toBeInstanceOf(ChatApiError)
    expect(error).not.toBeInstanceOf(SyntaxError)
    expect((error as Error).message).toBe(`request failed with status ${status}`)
  })
})
