export type IconName = "attach" | "check" | "chevron" | "send" | "spark" | "stop"
export type ModelId = "local" | "remote"

export type Message = {
  id: number
  body: string
  role: "assistant" | "user"
  time: string
}
