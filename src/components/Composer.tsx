import type { FormEvent, KeyboardEvent } from "react"
import { models } from "../models"
import type { ModelId } from "../types"
import { Icon } from "./Icon"

const submitOnEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault()
    event.currentTarget.form?.requestSubmit()
  }
}

function PromptTextarea({
  value,
  onChange,
  activeModel,
}: {
  value: string
  onChange: (value: string) => void
  activeModel: ModelId
}) {
  return (
    <textarea
      aria-label="Message"
      className="max-h-36 min-h-14 w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 outline-none placeholder:text-[#929996]"
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={submitOnEnter}
      placeholder={`Ask ${models[activeModel].name} anything…`}
      rows={2}
      value={value}
    />
  )
}

function ComposerFooter({ canSend }: { canSend: boolean }) {
  return (
    <div className="flex items-center justify-between px-1 pb-1">
      <button className="icon-button shrink-0" type="button" aria-label="Attach file">
        <Icon name="attach" />
      </button>
      <div className="flex items-center gap-3">
        <span className="hidden text-[10px] text-[#929996] sm:inline">Enter to send</span>
        <button
          aria-label="Send message"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#d66b50] text-white transition hover:bg-[#bd5941] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canSend}
          type="submit"
        >
          <Icon name="send" size={18} />
        </button>
      </div>
    </div>
  )
}

export function Composer({
  value,
  onChange,
  activeModel,
  onSubmit,
}: {
  value: string
  onChange: (value: string) => void
  activeModel: ModelId
  onSubmit: (event: FormEvent) => void
}) {
  return (
    <div className="shrink-0 bg-[#fbfaf7]/95 px-4 pb-4 pt-3 sm:px-10 sm:pb-6 lg:px-20">
      <form
        className="mx-auto max-w-3xl rounded-2xl border border-[#d5d5ce] bg-white p-2 shadow-[0_10px_35px_rgba(40,52,49,0.08)] focus-within:border-[#8fa39c]"
        onSubmit={onSubmit}
      >
        <PromptTextarea value={value} onChange={onChange} activeModel={activeModel} />
        <ComposerFooter canSend={Boolean(value.trim())} />
      </form>
      <p className="mt-2 text-center text-[10px] text-[#929996]">
        {models[activeModel].name} can make mistakes. Check important information.
      </p>
    </div>
  )
}
