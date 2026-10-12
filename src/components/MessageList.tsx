import { useEffect, useRef } from "react"
import type { Message as ChatMessage } from "../types"
import { Message } from "./Message"

export function MessageList({ messages }: { messages: ChatMessage[] }) {
  const conversationEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto px-5 py-8 sm:px-10 lg:px-20">
      <div className="mx-auto max-w-3xl">
        <div className="space-y-6">
          {messages.map((item) => (
            <Message key={item.id} message={item} />
          ))}
          <div ref={conversationEndRef} />
        </div>
      </div>
    </div>
  )
}
