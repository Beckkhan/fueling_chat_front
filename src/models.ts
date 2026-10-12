import type { ModelId } from "./types"

export const models = {
  local: {
    name: "Local model",
    description: "Runs privately on this device",
    label: "Private",
  },
  remote: {
    name: "Remote model",
    description: "Uses the hosted model for more complex tasks",
    label: "Cloud",
  },
} satisfies Record<ModelId, { name: string; description: string; label: string }>
