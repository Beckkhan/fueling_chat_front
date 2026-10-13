import { afterEach, describe, expect, it, vi } from "vitest"
import { ChatApiError, sendChat } from "./chat"

const okBody = { summary: "F-10001 completed", provider: "local", elapsed_ms: 42 }

const jsonResponse = (body: unknown, ok: boolean, status: number) =>
  ({
    ok,
    status,
    json: async () => body,
  }) as Response

describe("sendChat", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it("posts exactly {prompt, provider} as JSON to the VITE_API_URL base (default http://localhost:8080)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(okBody, true, 200))
    vi.stubGlobal("fetch", fetchMock)

    const result = await sendChat({ prompt: "Hello", provider: "local" })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe("http://localhost:8080/chat")
    expect(options.method).toBe("POST")
    expect(options.headers["Content-Type"]).toBe("application/json")
    expect(JSON.parse(options.body)).toEqual({ prompt: "Hello", provider: "local" })
    expect(result).toEqual(okBody)
  })

  it("includes fueling_id when the request pins one", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(okBody, true, 200))
    vi.stubGlobal("fetch", fetchMock)

    await sendChat({ prompt: "What about F-10001?", provider: "local", fueling_id: "F-10001" })

    const [, options] = fetchMock.mock.calls[0]
    expect(JSON.parse(options.body)).toEqual({
      prompt: "What about F-10001?",
      provider: "local",
      fueling_id: "F-10001",
    })
  })

  it("uses the custom VITE_API_URL when set (D-13)", async () => {
    vi.resetModules()
    vi.stubEnv("VITE_API_URL", "https://api.example.test")
    const fresh = await import("./chat")
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(okBody, true, 200))
    vi.stubGlobal("fetch", fetchMock)

    await fresh.sendChat({ prompt: "Hello", provider: "remote" })

    expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.test/chat")
  })

  it("maps a non-200 JSON body to a ChatApiError with the masked error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: "Bad request" }, false, 400)),
    )

    const promise = sendChat({ prompt: "Hello", provider: "local" })
    await expect(promise).rejects.toBeInstanceOf(ChatApiError)
    await expect(promise).rejects.toThrow("Bad request")
  })

  it("falls back to the masked status text when the error body is not JSON", async () => {
    const nonJsonBody = {
      ok: false,
      status: 502,
      json: async () => {
        throw new SyntaxError("Unexpected token '<'")
      },
    } as unknown as Response
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(nonJsonBody))

    const promise = sendChat({ prompt: "Hello", provider: "local" })
    await expect(promise).rejects.toBeInstanceOf(ChatApiError)
    await expect(promise).rejects.toThrow("request failed with status 502")
    await expect(promise).rejects.not.toBeInstanceOf(SyntaxError)
  })

  it("falls back to the masked status text when the JSON error body has no error field", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ detail: "hidden" }, false, 500)),
    )

    const promise = sendChat({ prompt: "Hello", provider: "local" })
    await expect(promise).rejects.toBeInstanceOf(ChatApiError)
    await expect(promise).rejects.toThrow("request failed with status 500")
  })
})
