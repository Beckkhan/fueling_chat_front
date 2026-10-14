// Scaffold for the fueling-id pin control (Block C). Mockup parity: reuse the existing palette
// tokens (#17302e, #fbfaf7, #d66b50, #929996, #d9d8d1) and Tailwind utilities from the T07–T09
// foundation; the Figma export has no pin UI, so the control stays minimal and in-style.

import { useState } from "react"

export interface FuelingPinProps {
  fuelingId: string | null
  onChange: (fuelingId: string | null) => void
}

export function FuelingPin({ fuelingId, onChange }: FuelingPinProps) {
  if (fuelingId !== null) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-[#d9d8d1] bg-white px-3 py-2">
        <span className="truncate text-sm font-medium text-[#929996]">{fuelingId}</span>
        <button
          aria-label="Unpin fueling id"
          className="shrink-0 rounded-lg bg-[#d66b50] px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-[#bd5941]"
          onClick={() => onChange(null)}
          type="button"
        >
          Unpin
        </button>
      </div>
    )
  }

  return (
    <PinForm
      onPin={(value) => {
        const next = value.trim()
        if (next !== "") onChange(next)
      }}
    />
  )
}

function PinForm({ onPin }: { onPin: (value: string) => void }) {
  const [draft, setDraft] = useState("")

  return (
    <form
      className="flex items-center gap-2 rounded-xl border border-[#d9d8d1] bg-white px-3 py-2"
      onSubmit={(event) => {
        event.preventDefault()
        onPin(draft)
      }}
    >
      <input
        aria-label="Fueling id"
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#929996]"
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Fueling id"
        value={draft}
      />
      <button
        aria-label="Pin fueling id"
        className="shrink-0 rounded-lg bg-[#d66b50] px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-[#bd5941] disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!draft.trim()}
        type="submit"
      >
        Pin
      </button>
    </form>
  )
}
