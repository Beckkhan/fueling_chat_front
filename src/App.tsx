import { useState } from "react"
import type { FormEvent } from "react"
import { ChatApiError, sendChat } from "./api/chat"
import { Composer } from "./components/Composer"
import { FuelingPin } from "./components/FuelingPin"
import { Header } from "./components/Header"
import { MessageList } from "./components/MessageList"
import type { Message, ModelId } from "./types"

export default function App() {
  const [activeModel, setActiveModel] = useState<ModelId>("local")
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  // Pinned fueling id — the single source for the CONTRACT-API-001 fueling_id field;
  // null means "not pinned" and the field is omitted from the payload.
  const [fuelingId, setFuelingId] = useState<string | null>(null)

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
      // `undefined` keeps JSON.stringify at exactly {prompt, provider} while nothing is pinned
      // (CONTRACT-API-001).
      const response = await sendChat({
        prompt: body,
        provider: activeModel,
        fueling_id: fuelingId ?? undefined,
      })
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
      // CONTRACT-UI-002: ChatApiError → its masked message; any other error
      // (network TypeError) → the generic "Something went wrong" muted bubble.
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
        <FuelingPin fuelingId={fuelingId} onChange={setFuelingId} />
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
