import { afterEach, describe, expect, it, vi } from "vitest"
import { API_BASE_URL, ChatApiError, sendChat } from "./chat"

/**
 * T15 API-client tests: payload shapes (CONTRACT-API-001), the D-13 base URL,
 * and masked error handling (CONTRACT-UI-002).
 *
 * `fetch` is stubbed per test. `vi.resetModules()` in afterEach lets the
 * VITE_API_URL test re-import ./chat with a stubbed env, while the static
 * imports above stay bound to the load-time module (the surface anchor stays green).
 */

const okBody = { summary: "F-10001 completed", provider: "local", elapsed_ms: 42 }

const jsonResponse = (body: unknown, ok: boolean, status: number) =>
  ({ ok, status, json: async () => body }) as Response

const nonJsonResponse = (status: number) =>
  ({
    ok: false,
    status,
    json: async () => {
      throw new SyntaxError("Unexpected token '<'")
    },
  }) as unknown as Response

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe("sendChat — T15 API client", () => {
  // Live anchor: pins the typed surface. The D-13 default is asserted through
  // the fetch URL in the payload-shape test below.
  it("exposes the typed client surface", () => {
    expect(typeof API_BASE_URL).toBe("string")
    expect(sendChat).toBeTypeOf("function")
    expect(ChatApiError.prototype instanceof Error).toBe(true)
  })

  it("posts exactly {prompt, provider} as application/json to http://localhost:8080/chat and returns the summary", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(okBody, true, 200))
    vi.stubGlobal("fetch", fetchMock)

    const result = await sendChat({ prompt: "Hello", provider: "local" })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe("http://localhost:8080/chat") // D-13 default base
    expect(options.method).toBe("POST")
    expect(options.headers["Content-Type"]).toBe("application/json")
    // toEqual, not toMatchObject: exactly these 2 keys, no fueling_id when absent.
    expect(JSON.parse(options.body)).toEqual({ prompt: "Hello", provider: "local" })
    expect(result).toEqual(okBody)
  })

  it("includes fueling_id in the payload only when the request pins one", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(okBody, true, 200))
    vi.stubGlobal("fetch", fetchMock)

    await sendChat({ prompt: "What about F-10001?", provider: "local", fueling_id: "F-10001" })

    // Exactly these 3 keys (D-9: an explicit field, never extracted from the prompt).
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      prompt: "What about F-10001?",
      provider: "local",
      fueling_id: "F-10001",
    })
  })

  it("uses the custom VITE_API_URL when set", async () => {
    vi.resetModules()
    vi.stubEnv("VITE_API_URL", "https://api.example.test")
    const fresh = await import("./chat") // re-evaluates API_BASE_URL

    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(okBody, true, 200))
    vi.stubGlobal("fetch", fetchMock)

    await fresh.sendChat({ prompt: "Hello", provider: "remote" })

    expect(fetchMock.mock.calls[0][0]).toBe("https://api.example.test/chat")
  })

  it("maps a non-200 JSON error body to ChatApiError with the masked error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ error: "Bad request" }, false, 400)),
    )

    const promise = sendChat({ prompt: "Hello", provider: "local" })

    await expect(promise).rejects.toBeInstanceOf(ChatApiError)
    await expect(promise).rejects.toThrow("Bad request") // masked message verbatim
  })

  it("falls back to the masked status text when the error body is not JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(nonJsonResponse(502)))

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

    await expect(sendChat({ prompt: "Hello", provider: "local" })).rejects.toThrow(
      "request failed with status 500",
    )
  })
})
