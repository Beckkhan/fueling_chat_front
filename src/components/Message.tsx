import type { Message as ChatMessage } from "../types"
import { Icon } from "./Icon"

export function Message({ message }: { message: ChatMessage }) {
  return (
    <article className={`flex gap-3 sm:gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold sm:size-9 ${
          message.role === "assistant" ? "bg-[#17302e] text-white" : "bg-[#cdd7df] text-[#17302e]"
        }`}
      >
        {message.role === "assistant" ? (
          <Icon name="spark" size={16} />
        ) : message.role === "user" ? (
          "You"
        ) : (
          "!"
        )}
      </div>
      <div className={`max-w-[82%] sm:max-w-[72%] ${message.role === "user" ? "items-end" : ""}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-[15px] leading-relaxed sm:px-5 sm:py-4 ${
            message.role === "assistant"
              ? "rounded-tl-md border border-[#e3e1dc] bg-white text-[#263936]"
              : message.role === "user"
                ? "rounded-tr-md bg-[#1e4b47] text-[#fbfaf7]"
                : "rounded-tl-md border border-[#e3e1dc] bg-[#f4f2ed] text-[#929996]"
          }`}
        >
          {message.body}
        </div>
        <p
          className={`mt-1.5 px-1 text-[10px] text-[#929996] ${message.role === "user" ? "text-right" : ""}`}
        >
          {message.time}
        </p>
      </div>
    </article>
  )
}
