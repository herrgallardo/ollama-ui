import type { ChatMessage } from "@/app/types/chat"

const STORAGE_KEY = "ollama-chat-history"
const STORAGE_VERSION = 1
const MAX_STORAGE_SIZE = 5 * 1024 * 1024 // 5MB limit

interface StoredData {
  version: number
  messages: ChatMessage[]
  model: string
  timestamp: number
}

export class ChatStorage {
  static save(messages: ChatMessage[], model: string): boolean {
    try {
      const data: StoredData = {
        version: STORAGE_VERSION,
        messages: messages,
        model: model,
        timestamp: Date.now(),
      }

      const serialized = JSON.stringify(data)

      // Check size before saving
      if (serialized.length > MAX_STORAGE_SIZE) {
        console.warn("Chat history too large, truncating older messages")
        // Keep only recent messages that fit
        const recentMessages = messages.slice(-Math.floor(messages.length / 2))
        data.messages = recentMessages
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      return true
    } catch (error) {
      console.error("Failed to save chat history:", error)
      // Handle quota exceeded error
      if (
        error instanceof DOMException &&
        error.name === "QuotaExceededError"
      ) {
        // Try to save with fewer messages
        try {
          const recentMessages = messages.slice(-10) // Keep last 10 messages
          const data: StoredData = {
            version: STORAGE_VERSION,
            messages: recentMessages,
            model: model,
            timestamp: Date.now(),
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
          return true
        } catch {
          return false
        }
      }
      return false
    }
  }

  static load(): { messages: ChatMessage[]; model?: string } | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return null

      const data: StoredData = JSON.parse(stored)

      // Version check for future compatibility
      if (data.version !== STORAGE_VERSION) {
        console.warn("Storage version mismatch, clearing old data")
        this.clear()
        return null
      }

      // Validate data structure
      if (!Array.isArray(data.messages)) {
        console.error("Invalid stored data structure")
        this.clear()
        return null
      }

      return {
        messages: data.messages,
        model: data.model,
      }
    } catch (error) {
      console.error("Failed to load chat history:", error)
      // Clear corrupted data
      this.clear()
      return null
    }
  }

  static clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error("Failed to clear chat history:", error)
    }
  }

  static getStorageSize(): number {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? new Blob([stored]).size : 0
    } catch {
      return 0
    }
  }

  static isNearLimit(): boolean {
    return this.getStorageSize() > MAX_STORAGE_SIZE * 0.8 // 80% of limit
  }
}
