import type { ModelId } from "../types"
import { Icon } from "./Icon"
import { ModelSwitcher } from "./ModelSwitcher"

export function Header({
  activeModel,
  onChange,
}: {
  activeModel: ModelId
  onChange: (model: ModelId) => void
}) {
  return (
    <header className="relative z-10 flex h-[82px] shrink-0 items-center justify-between border-b border-[#e2e0da] px-5 sm:px-8">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#17302e] text-[#f8f7f3]">
          <Icon name="spark" size={21} />
        </div>
        <div>
          <p className="font-display text-base font-semibold tracking-[-0.02em]">Fueling Chat</p>
          <p className="mt-0.5 text-[11px] text-[#77817e]">Private workspace</p>
        </div>
      </div>

      <ModelSwitcher activeModel={activeModel} onChange={onChange} />
    </header>
  )
}
