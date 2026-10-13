import { useState } from "react"
import type { FormEvent } from "react"
import { ChatApiError, sendChat } from "./api/chat"
import { Composer } from "./components/Composer"
import { Header } from "./components/Header"
import { MessageList } from "./components/MessageList"
import type { Message, ModelId } from "./types"

export default function App() {
  const [activeModel, setActiveModel] = useState<ModelId>("local")
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])

  const currentTime = () =>
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault()
    const body = message.trim()
    if (!body) return

    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        body,
        role: "user",
        time: currentTime(),
      },
    ])
    setMessage("")

    try {
      // CONTRACT-API-001: send exactly {prompt, provider} — activeModel
      // defaults to "local" (D-10) and follows the switcher. A pinned
      // `fueling_id` (D-9: an explicit field, never extracted from the prompt)
      // is added by the client when the request carries one; the mockup (G-1)
      // defines no pin control yet, so that path lives in api/chat.test.ts
      // until the UI exists — no App state for it.
      const response = await sendChat({ prompt: body, provider: activeModel })
      setMessages((current) => [
        ...current,
        {
          id: Date.now(),
          body: response.summary,
          role: "assistant",
          time: currentTime(),
        },
      ])
    } catch (error) {
      // CONTRACT-UI-002: ChatApiError.message is already masked by api/chat.ts
      // (JSON error body, or the status fallback `request failed with status <n>`
      // for non-JSON bodies) — render it verbatim. Any other rejection (network
      // failure, e.g. fetch rejecting with TypeError) renders the generic
      // "Something went wrong". Both branches keep the muted bubble: role "error"
      // renders bg-[#f4f2ed] / text-[#929996] in Message.tsx — no markup changes here.
      const body =
        error instanceof ChatApiError && error.message ? error.message : "Something went wrong"
      setMessages((current) => [
        ...current,
        {
          id: Date.now(),
          body,
          role: "error",
          time: currentTime(),
        },
      ])
    }
  }

  return (
    <main className="min-h-screen bg-[#e8e4dc] p-0 text-[#17302e] md:p-5 lg:p-8">
      <section className="mx-auto flex h-screen max-w-[1120px] flex-col overflow-hidden bg-[#fbfaf7] shadow-[0_24px_70px_rgba(31,44,41,0.12)] md:h-[calc(100vh-2.5rem)] md:rounded-[28px] lg:h-[calc(100vh-4rem)]">
        <Header activeModel={activeModel} onChange={setActiveModel} />
        <MessageList messages={messages} />
        <Composer
          value={message}
          onChange={setMessage}
          activeModel={activeModel}
          onSubmit={sendMessage}
        />
      </section>
    </main>
  )
}
