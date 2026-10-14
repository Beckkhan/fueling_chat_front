import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Mock } from "vitest"
import App from "./App"

const okResponse = (body: unknown) =>
  ({
    ok: true,
    status: 200,
    json: async () => body,
  }) as Response

async function send(text: string) {
  const input = screen.getByLabelText("Message")
  fireEvent.change(input, { target: { value: text } })
  fireEvent.keyDown(input, { key: "Enter", shiftKey: false })
}

function pinFuelingId(fuelingId: string) {
  fireEvent.change(screen.getByLabelText("Fueling id"), { target: { value: fuelingId } })
  fireEvent.click(screen.getByRole("button", { name: "Pin fueling id" }))
}

// Asserts the CONTRACT-API-001 request envelope and returns the parsed JSON body.
function requestBody(fetchMock: Mock, callIndex = 0): Record<string, unknown> {
  const [url, options] = fetchMock.mock.calls[callIndex]
  expect(url).toBe("http://localhost:8080/chat")
  expect(options.method).toBe("POST")
  expect(options.headers["Content-Type"]).toBe("application/json")
  return JSON.parse(options.body) as Record<string, unknown>
}

describe("pin and network-failure flows", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("includes fueling_id in the payload when a fueling id is pinned", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        okResponse({ summary: "Before pinning", provider: "local", elapsed_ms: 2 }),
      )
      .mockResolvedValueOnce(
        okResponse({ summary: "After pinning", provider: "local", elapsed_ms: 3 }),
      )
    vi.stubGlobal("fetch", fetchMock)
    render(<App />)

    await send("First question")
    await screen.findByText("Before pinning")

    const unpinned = requestBody(fetchMock, 0)
    expect(unpinned).toEqual({ prompt: "First question", provider: "local" })
    expect("fueling_id" in unpinned).toBe(false)

    pinFuelingId("F-10001")
    await send("What do we know about fueling F-10001?")
    await screen.findByText("After pinning")

    expect(requestBody(fetchMock, 1)).toEqual({
      prompt: "What do we know about fueling F-10001?",
      provider: "local",
      fueling_id: "F-10001",
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("renders the generic network-failure message in a muted bubble when the request fails", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
    vi.stubGlobal("fetch", fetchMock)
    render(<App />)

    await send("Hello")

    const bubble = await screen.findByText("Something went wrong")
    expect(bubble.className).toContain("bg-[#f4f2ed]")
    expect(bubble.className).toContain("text-[#929996]")
    expect(screen.queryByText("Failed to fetch")).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:8080/chat")
  })
})
