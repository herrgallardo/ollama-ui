export type ErrorSeverity = "error" | "warning" | "info"

export interface AppError {
  message: string
  severity: ErrorSeverity
  details?: string
  recoverable?: boolean
  action?: {
    label: string
    handler: () => void
  }
}

export class OllamaError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: string
  ) {
    super(message)
    this.name = "OllamaError"
  }
}
