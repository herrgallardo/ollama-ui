import { OllamaError } from "@/app/types/errors"

export function parseOllamaError(error: unknown): OllamaError {
  if (error instanceof OllamaError) {
    return error
  }

  if (error instanceof Error) {
    // Parse specific Ollama error patterns
    if (error.message.includes("ECONNREFUSED")) {
      return new OllamaError(
        "Cannot connect to Ollama",
        "CONNECTION_REFUSED",
        "Make sure Ollama is running locally. Try running 'ollama serve' in your terminal."
      )
    }

    if (error.message.includes("model not found")) {
      return new OllamaError(
        "Model not found",
        "MODEL_NOT_FOUND",
        "The selected model is not installed. Pull it using 'ollama pull' command."
      )
    }

    if (error.message.includes("timeout")) {
      return new OllamaError(
        "Request timed out",
        "TIMEOUT",
        "The model is taking too long to respond. Try again or use a smaller model."
      )
    }

    return new OllamaError(error.message, "UNKNOWN", error.stack)
  }

  return new OllamaError(
    "An unexpected error occurred",
    "UNKNOWN",
    String(error)
  )
}

export function getErrorMessage(error: unknown): string {
  const ollamaError = parseOllamaError(error)
  return ollamaError.details || ollamaError.message
}
