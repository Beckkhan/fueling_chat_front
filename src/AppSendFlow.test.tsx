import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import App from "./App"

const okResponse = (body: unknown) =>
  ({
    ok: true,
    status: 200,
    json: async () => body,
  }) as Response

const errorResponse = (status: number, error: string) =>
  ({
    ok: false,
    status,
    json: async () => ({ error }),
    text: async () => JSON.stringify({ error }),
  }) as Response

async function send(text: string) {
  const input = screen.getByLabelText("Message")
  fireEvent.change(input, { target: { value: text } })
  fireEvent.keyDown(input, { key: "Enter", shiftKey: false })
}

describe("send flow", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("posts exactly one request with prompt and provider to the chat endpoint", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(okResponse({ summary: "Done", provider: "local", elapsed_ms: 12 }))
    vi.stubGlobal("fetch", fetchMock)
    render(<App />)

    await send("What do we know about fueling F-10001?")
    await screen.findByText("Done")

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe("http://localhost:8080/chat")
    expect(options.method).toBe("POST")
    expect(options.headers["Content-Type"]).toBe("application/json")
    expect(JSON.parse(options.body)).toEqual({
      prompt: "What do we know about fueling F-10001?",
      provider: "local",
    })
  })

  it("appends the assistant bubble from summary with the role styling", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          okResponse({ summary: "F-10001 completed", provider: "local", elapsed_ms: 7 }),
        ),
    )
    render(<App />)

    await send("Tell me about F-10001")

    const bubble = await screen.findByText("F-10001 completed")
    expect(bubble.className).toContain("bg-white")
    expect(bubble.className).toContain("rounded-tl-md")
  })

  it("reflects the active model id in the provider field", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(okResponse({ summary: "Done", provider: "remote", elapsed_ms: 3 }))
    vi.stubGlobal("fetch", fetchMock)
    render(<App />)

    fireEvent.click(screen.getByRole("button", { name: /Local model/ }))
    fireEvent.click(screen.getByRole("option", { name: /Remote model/ }))
    await send("Hello")
    await screen.findByText("Done")

    const [, options] = fetchMock.mock.calls[0]
    expect(JSON.parse(options.body)).toEqual({ prompt: "Hello", provider: "remote" })
  })

  it.each([
    [400, "Bad request"],
    [500, "Databases unavailable"],
    [502, "Provider unreachable"],
  ])("renders the masked error body in a muted bubble for status %i", async (status, errorText) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(errorResponse(status, errorText)))
    render(<App />)

    await send("Hello")

    const bubble = await screen.findByText(errorText)
    expect(bubble.className).toContain("bg-[#f4f2ed]")
    expect(bubble.className).toContain("text-[#929996]")
    await waitFor(() => expect(screen.getByLabelText("Message")).toHaveValue(""))
  })
})
