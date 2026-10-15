import { useState } from "react"
import type { FormEvent } from "react"
import { BackendUnavailableError, ChatApiError, sendChat } from "./api/chat"
import { Composer } from "./components/Composer"
import { Header } from "./components/Header"
import { MessageList } from "./components/MessageList"
import { models } from "./models"
import type { Message, ModelId } from "./types"

const currentTime = () =>
  new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })

const errorMessage = (error: unknown) => {
  if (error instanceof BackendUnavailableError) return error.message
  if (error instanceof ChatApiError && error.message) return error.message
  return "Something went wrong"
}

const responseMeta = (provider: string, elapsedMs: number) => {
  const name = provider === "local" ? models.local.name : provider === "remote" ? models.remote.name : provider
  const elapsed = elapsedMs >= 1000 ? `${(elapsedMs / 1000).toFixed(1)} s` : `${elapsedMs} ms`
  return `${name} · ${elapsed}`
}

const assistantMessage = (summary: string, provider: string, elapsedMs: number): Message => ({
  id: Date.now(),
  body: summary,
  role: "assistant",
  time: currentTime(),
  meta: responseMeta(provider, elapsedMs),
})

function ChatLayout({
  activeModel,
  setActiveModel,
  messages,
  message,
  setMessage,
  onSubmit,
}: {
  activeModel: ModelId
  setActiveModel: (model: ModelId) => void
  messages: Message[]
  message: string
  setMessage: (value: string) => void
  onSubmit: (event: FormEvent) => void
}) {
  return (
    <main className="min-h-screen bg-[#e8e4dc] p-0 text-[#17302e] md:p-5 lg:p-8">
      <section className="mx-auto flex h-screen max-w-[1120px] flex-col overflow-hidden bg-[#fbfaf7] shadow-[0_24px_70px_rgba(31,44,41,0.12)] md:h-[calc(100vh-2.5rem)] md:rounded-[28px] lg:h-[calc(100vh-4rem)]">
        <Header activeModel={activeModel} onChange={setActiveModel} />
        <MessageList messages={messages} />
        <Composer
          value={message}
          onChange={setMessage}
          activeModel={activeModel}
          onSubmit={onSubmit}
        />
      </section>
    </main>
  )
}

export function App() {
  const [activeModel, setActiveModel] = useState<ModelId>("local")
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const sendMessage = async (event: FormEvent) => {
    event.preventDefault()
    const body = message.trim()
    if (!body) return

    setMessages((current) => [
      ...current,
      { id: Date.now(), body, role: "user", time: currentTime() },
    ])
    setMessage("")

    try {
      const response = await sendChat({ prompt: body, provider: activeModel })
      setMessages((current) => [
        ...current,
        assistantMessage(response.summary, response.provider, response.elapsed_ms),
      ])
    } catch (error) {
      setMessages((current) => [
        ...current,
        { id: Date.now(), body: errorMessage(error), role: "error", time: currentTime() },
      ])
    }
  }

  return (
    <ChatLayout
      activeModel={activeModel}
      setActiveModel={setActiveModel}
      messages={messages}
      message={message}
      setMessage={setMessage}
      onSubmit={sendMessage}
    />
  )
}
