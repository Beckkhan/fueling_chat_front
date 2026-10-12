import { useState } from "react"
import type { FormEvent } from "react"
import { Composer } from "./components/Composer"
import { Header } from "./components/Header"
import { MessageList } from "./components/MessageList"
import type { Message, ModelId } from "./types"

export default function App() {
  const [activeModel, setActiveModel] = useState<ModelId>("local")
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])

  const sendMessage = (event: FormEvent) => {
    event.preventDefault()
    const body = message.trim()
    if (!body) return

    setMessages((current) => [
      ...current,
      {
        id: Date.now(),
        body,
        role: "user",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ])
    setMessage("")
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
