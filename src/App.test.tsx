import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import App from "./App"

describe("App", () => {
  it("renders the header per the mockup", () => {
    render(<App />)

    expect(screen.getByText("Fueling Chat")).toBeInTheDocument()
    expect(screen.getByText("Private workspace")).toBeInTheDocument()
  })

  it("renders the model switcher with the mockup labels", () => {
    render(<App />)

    expect(screen.getByRole("button", { name: /Local model/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /Local model/ }))
    expect(screen.getByText("Choose model")).toBeInTheDocument()
    expect(screen.getByText("Private")).toBeInTheDocument()
    expect(screen.getByText("Remote model")).toBeInTheDocument()
    expect(screen.getByText("Cloud")).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /Local model/ })).toHaveAttribute(
      "aria-selected",
      "true",
    )
  })

  it("switches the active model and closes the menu", () => {
    render(<App />)

    fireEvent.click(screen.getByRole("button", { name: /Local model/ }))
    fireEvent.click(screen.getByRole("option", { name: /Remote model/ }))

    expect(screen.getByRole("button", { name: /Remote model/ })).toBeInTheDocument()
    expect(screen.queryByText("Choose model")).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText("Ask Remote model anything…")).toBeInTheDocument()
  })

  it("renders the composer per the mockup", () => {
    render(<App />)

    expect(screen.getByLabelText("Message")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Ask Local model anything…")).toBeInTheDocument()
    expect(screen.getByLabelText("Attach file")).toBeInTheDocument()
    expect(screen.getByText("Enter to send")).toBeInTheDocument()
    expect(
      screen.getByText("Local model can make mistakes. Check important information."),
    ).toBeInTheDocument()
  })

  it("disables the send button while the input is empty", () => {
    render(<App />)

    const sendButton = screen.getByLabelText("Send message")
    expect(sendButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "F-10001" } })
    expect(sendButton).toBeEnabled()
  })

  it("sends on Enter, appends an optimistic user bubble and scrolls to it", () => {
    const scrollSpy = vi.spyOn(Element.prototype, "scrollIntoView")
    render(<App />)

    const input = screen.getByLabelText("Message")
    fireEvent.change(input, { target: { value: "What about F-10001?" } })
    fireEvent.keyDown(input, { key: "Enter", shiftKey: false })

    expect(screen.getByText("What about F-10001?")).toBeInTheDocument()
    expect(input).toHaveValue("")
    expect(screen.getByLabelText("Send message")).toBeDisabled()
    expect(scrollSpy).toHaveBeenCalled()
    scrollSpy.mockRestore()
  })

  it("inserts a newline on Shift+Enter instead of sending", () => {
    render(<App />)

    const input = screen.getByLabelText("Message")
    fireEvent.change(input, { target: { value: "line one" } })
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true })

    expect(screen.queryAllByRole("article")).toHaveLength(0)
    expect(input).toHaveValue("line one")
  })
})
