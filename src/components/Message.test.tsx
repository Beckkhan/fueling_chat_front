import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { Message } from "./Message"

describe("Message", () => {
  it("renders a user bubble right-aligned dark-green with avatar, body and time", () => {
    render(<Message message={{ id: 1, body: "Hello", role: "user", time: "10:16" }} />)

    const bubble = screen.getByText("Hello")
    expect(bubble.className).toContain("bg-[#1e4b47]")
    expect(bubble.className).toContain("rounded-tr-md")
    expect(screen.getByText("You")).toBeInTheDocument()
    expect(screen.getByText("10:16")).toBeInTheDocument()
    expect(bubble.closest("article")).toHaveClass("flex-row-reverse")
  })

  it("renders an assistant bubble left-aligned white with avatar, body and time", () => {
    render(
      <Message message={{ id: 2, body: "How can I help?", role: "assistant", time: "10:17" }} />,
    )

    const bubble = screen.getByText("How can I help?")
    expect(bubble.className).toContain("bg-white")
    expect(bubble.className).toContain("rounded-tl-md")
    expect(screen.getByText("10:17")).toBeInTheDocument()
    expect(bubble.closest("article")).not.toHaveClass("flex-row-reverse")
  })

  it("renders an error bubble left-aligned muted", () => {
    render(
      <Message message={{ id: 3, body: "Databases unavailable", role: "error", time: "10:18" }} />,
    )

    const bubble = screen.getByText("Databases unavailable")
    expect(bubble.className).toContain("bg-[#f4f2ed]")
    expect(bubble.className).toContain("text-[#929996]")
    expect(screen.getByText("!")).toBeInTheDocument()
    expect(bubble.closest("article")).not.toHaveClass("flex-row-reverse")
  })
})
