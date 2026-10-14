import { useEffect, useRef, useState } from "react"
import { models } from "../models"
import type { ModelId } from "../types"
import { Icon } from "./Icon"

function ModelSwitcherTrigger({
  activeModel,
  open,
  onToggle,
}: {
  activeModel: ModelId
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      aria-expanded={open}
      aria-haspopup="listbox"
      className="flex items-center gap-2 rounded-xl border border-[#d9d8d1] bg-white px-3 py-2 text-left transition hover:border-[#aab5b0] sm:min-w-48 sm:px-4"
      onClick={onToggle}
    >
      <span className="flex size-2 rounded-full bg-[#4e7667]" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold sm:text-sm">
          {models[activeModel].name}
        </span>
      </span>
      <span className={`text-[#75807c] transition-transform ${open ? "rotate-180" : ""}`}>
        <Icon name="chevron" size={16} />
      </span>
    </button>
  )
}

const optionClass = (selected: boolean) =>
  `flex w-full items-start gap-3 rounded-xl p-3 text-left transition ${
    selected ? "bg-[#edf0ec]" : "hover:bg-[#f4f2ed]"
  }`

const iconBadgeClass = (modelId: ModelId) =>
  `mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${
    modelId === "local" ? "bg-[#d4dfda] text-[#315d54]" : "bg-[#ead8ce] text-[#a7523e]"
  }`

function ModelOption({
  modelId,
  selected,
  onSelect,
}: {
  modelId: ModelId
  selected: boolean
  onSelect: () => void
}) {
  const model = models[modelId]
  return (
    <button
      aria-selected={selected}
      className={optionClass(selected)}
      onClick={onSelect}
      role="option"
    >
      <span className={iconBadgeClass(modelId)}>
        <Icon name={modelId === "local" ? "spark" : "send"} size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">{model.name}</span>
          <span className="text-[10px] font-medium text-[#7e8884]">{model.label}</span>
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-[#77817e]">
          {model.description}
        </span>
      </span>
      <span className={`mt-1 text-[#315d54] ${selected ? "opacity-100" : "opacity-0"}`}>
        <Icon name="check" size={16} />
      </span>
    </button>
  )
}

function ModelMenu({
  activeModel,
  onSelect,
}: {
  activeModel: ModelId
  onSelect: (modelId: ModelId) => void
}) {
  return (
    <div
      aria-label="Choose AI model"
      className="absolute right-0 top-[calc(100%+0.5rem)] w-[min(21rem,calc(100vw-2rem))] rounded-2xl border border-[#deddd6] bg-[#fffefa] p-2 shadow-[0_18px_50px_rgba(31,44,41,0.14)]"
      role="listbox"
    >
      <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#89918e]">
        Choose model
      </p>
      {(Object.keys(models) as ModelId[]).map((modelId) => (
        <ModelOption
          key={modelId}
          modelId={modelId}
          selected={activeModel === modelId}
          onSelect={() => onSelect(modelId)}
        />
      ))}
    </div>
  )
}

export function ModelSwitcher({
  activeModel,
  onChange,
}: {
  activeModel: ModelId
  onChange: (model: ModelId) => void
}) {
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const modelMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const closeMenu = (event: MouseEvent) => {
      if (!modelMenuRef.current?.contains(event.target as Node)) {
        setModelMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", closeMenu)
    return () => document.removeEventListener("mousedown", closeMenu)
  }, [])

  return (
    <div className="relative" ref={modelMenuRef}>
      <ModelSwitcherTrigger
        activeModel={activeModel}
        open={modelMenuOpen}
        onToggle={() => setModelMenuOpen((open) => !open)}
      />
      {modelMenuOpen && (
        <ModelMenu
          activeModel={activeModel}
          onSelect={(modelId) => {
            onChange(modelId)
            setModelMenuOpen(false)
          }}
        />
      )}
    </div>
  )
}
