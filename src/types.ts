export type IconName = "attach" | "check" | "chevron" | "send" | "spark" | "stop"
export type ModelId = "local" | "remote"

export type Message = {
  id: number
  body: string
  role: "assistant" | "user" | "error"
  time: string
}

export type ChatRequest = {
  prompt: string
  fueling_id?: string
  provider?: string
}

export type ChatResponse = {
  summary: string
  provider: string
  elapsed_ms: number
}
