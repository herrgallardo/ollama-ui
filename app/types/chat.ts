export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
  model?: string
  timestamp?: Date
  stats?: ChatStats
}

export interface ChatStats {
  tokensPerSecond?: number
  promptTokensPerSecond?: number
  totalTokens?: number
  promptTokens?: number
  generationTime?: number
  totalTime?: number
}

export interface StreamResponse {
  content: string
  stats?: {
    eval_count?: number
    eval_duration?: number
    prompt_eval_count?: number
    prompt_eval_duration?: number
    total_duration?: number
  }
}

export interface Model {
  name: string
  size: number
  modified_at: string
}

export type SystemPromptKey = "default" | "coder" | "teacher" | "creative"

export interface SystemPrompts {
  [key: string]: string
  default: string
  coder: string
  teacher: string
  creative: string
}
