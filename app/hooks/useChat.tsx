"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { parseOllamaError } from "@/app/utils/errorHandler"
import { ChatStorage } from "@/app/utils/chatStorage"
import { SYSTEM_PROMPTS, CHAT_EXPORT_PREFIX } from "@/app/constants/prompts"
import {
  useDebounce,
  usePerformanceTimer,
  useRenderPerformance,
} from "./usePerformance"
import type { ChatMessage, SystemPromptKey } from "@/app/types/chat"

interface UseChatProps {
  selectedModel: string
  systemPrompt: SystemPromptKey
  isConnected: boolean
  addToast: (toast: {
    message: string
    type: "success" | "error" | "warning" | "info"
    duration?: number
  }) => void
}

interface UseChatReturn {
  // State
  messages: ChatMessage[]
  input: string
  setInput: (value: string) => void
  loading: boolean
  streamingContent: string
  currentStats?: ChatMessage["stats"]

  // Actions
  sendMessage: () => Promise<void>
  clearChat: () => void
  exportChat: () => void
  cancelGeneration: () => void
  retryLastMessage: () => Promise<void>
  editMessage: (index: number, newContent: string) => void
  deleteMessage: (index: number) => void

  // Status
  isNearStorageLimit: boolean
  messageCount: number
  canRetry: boolean
}

export function useChat({
  selectedModel,
  systemPrompt,
  isConnected,
  addToast,
}: UseChatProps): UseChatReturn {
  // Performance monitoring
  useRenderPerformance("useChat")
  const { startTimer } = usePerformanceTimer("sendMessage")

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const [currentStats, setCurrentStats] = useState<ChatMessage["stats"]>()
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(
    null
  )

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null)
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 3

  // Debounced save function to prevent excessive localStorage writes
  const debouncedSave = useDebounce((msgs: ChatMessage[], model: string) => {
    ChatStorage.save(msgs, model)
  }, 1000)

  // Memoized values
  const messageCount = useMemo(() => messages.length, [messages])
  const canRetry = useMemo(
    () => lastFailedMessage !== null && !loading && isConnected,
    [lastFailedMessage, loading, isConnected]
  )

  // Simple computed value - no need to memoize a simple function call
  const isNearStorageLimit = ChatStorage.isNearLimit()

  // Load chat history on mount
  useEffect(() => {
    const stored = ChatStorage.load()
    if (stored && stored.messages.length > 0) {
      setMessages(stored.messages)
      addToast({
        message: `Restored ${stored.messages.length} messages`,
        type: "info",
        duration: 3000,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  // Auto-save messages with debouncing
  useEffect(() => {
    if (messages.length > 0) {
      debouncedSave(messages, selectedModel)
    }
  }, [messages, selectedModel, debouncedSave])

  // Save before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (messages.length > 0) {
        ChatStorage.save(messages, selectedModel)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [messages, selectedModel])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current)
      }
    }
  }, [])

  // Clear chat function
  const clearChat = useCallback(() => {
    setMessages([])
    setStreamingContent("")
    setCurrentStats(undefined)
    setLastFailedMessage(null)
    retryCountRef.current = 0
    ChatStorage.clear()
    addToast({
      message: "Chat cleared",
      type: "success",
      duration: 2000,
    })
  }, [addToast])

  // Export chat function
  const exportChat = useCallback(() => {
    try {
      const text = messages
        .map((m) => {
          let msgText = `${m.role.toUpperCase()}: ${m.content}`
          if (m.stats) {
            msgText += `\n[Stats: ${m.stats.totalTokens} tokens, ${m.stats.tokensPerSecond} tokens/sec]`
          }
          return msgText
        })
        .join("\n\n")

      const blob = new Blob([text], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${CHAT_EXPORT_PREFIX}-${new Date().toISOString()}.txt`
      a.click()
      URL.revokeObjectURL(url)

      addToast({
        message: "Chat exported successfully",
        type: "success",
        duration: 3000,
      })
    } catch {
      addToast({
        message: "Failed to export chat",
        type: "error",
      })
    }
  }, [messages, addToast])

  // Cancel generation function
  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setLoading(false)

      if (streamingContent) {
        const completeMessages = [
          ...messages,
          {
            role: "assistant",
            content: streamingContent + " [Generation cancelled]",
            model: selectedModel,
          },
        ] as ChatMessage[]

        setMessages(completeMessages)
        setStreamingContent("")
        setCurrentStats(undefined)
        ChatStorage.save(completeMessages, selectedModel)
      }

      addToast({
        message: "Generation cancelled",
        type: "info",
        duration: 3000,
      })
    }
  }, [messages, streamingContent, selectedModel, addToast])

  // Edit message function
  const editMessage = useCallback(
    (index: number, newContent: string) => {
      if (index < 0 || index >= messages.length) return

      const updatedMessages = messages.map((msg, i) =>
        i === index ? { ...msg, content: newContent } : msg
      )

      setMessages(updatedMessages)
      ChatStorage.save(updatedMessages, selectedModel)

      addToast({
        message: "Message edited",
        type: "success",
        duration: 2000,
      })
    },
    [messages, selectedModel, addToast]
  )

  // Delete message function
  const deleteMessage = useCallback(
    (index: number) => {
      if (index < 0 || index >= messages.length) return

      const updatedMessages = messages.filter((_, i) => i !== index)
      setMessages(updatedMessages)
      ChatStorage.save(updatedMessages, selectedModel)

      addToast({
        message: "Message deleted",
        type: "success",
        duration: 2000,
      })
    },
    [messages, selectedModel, addToast]
  )

  // Core send message function
  const sendMessageCore = useCallback(
    async (messageText: string, isRetry = false) => {
      if (!messageText.trim() || loading) return

      if (!isConnected) {
        addToast({
          message: "Cannot send message: Ollama is not connected",
          type: "error",
        })
        return
      }

      const endTimer = startTimer()
      const userMessage: ChatMessage = { role: "user", content: messageText }
      const newMessages = isRetry ? messages : [...messages, userMessage]

      if (!isRetry) {
        setMessages(newMessages)
        setInput("")
      }

      setLoading(true)
      setStreamingContent("")
      setCurrentStats(undefined)
      setLastFailedMessage(null)
      abortControllerRef.current = new AbortController()

      // Set a timeout for streaming to detect stalled responses
      streamingTimeoutRef.current = setTimeout(() => {
        if (loading && !streamingContent) {
          addToast({
            message: "Response is taking longer than expected...",
            type: "warning",
            duration: 4000,
          })
        }
      }, 10000) // 10 seconds

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages,
            model: selectedModel,
            systemPrompt: SYSTEM_PROMPTS[systemPrompt],
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          throw new Error(
            errorData.error || `HTTP ${res.status}: ${res.statusText}`
          )
        }

        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        let content = ""
        let stats: ChatMessage["stats"] = {}
        let hasReceivedContent = false

        while (reader) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n").filter((line) => line.trim())

          for (const line of lines) {
            try {
              const data = JSON.parse(line)

              if (data.content) {
                hasReceivedContent = true
                content += data.content
                setStreamingContent(content)

                // Clear streaming timeout once we receive content
                if (streamingTimeoutRef.current) {
                  clearTimeout(streamingTimeoutRef.current)
                  streamingTimeoutRef.current = null
                }
              }

              if (data.stats) {
                const tokensPerSecond = data.stats.eval_duration
                  ? data.stats.eval_count / (data.stats.eval_duration / 1e9)
                  : undefined

                const promptTokensPerSecond = data.stats.prompt_eval_duration
                  ? data.stats.prompt_eval_count /
                    (data.stats.prompt_eval_duration / 1e9)
                  : undefined

                stats = {
                  tokensPerSecond: tokensPerSecond
                    ? Math.round(tokensPerSecond * 10) / 10
                    : undefined,
                  promptTokensPerSecond: promptTokensPerSecond
                    ? Math.round(promptTokensPerSecond * 10) / 10
                    : undefined,
                  totalTokens: data.stats.eval_count,
                  promptTokens: data.stats.prompt_eval_count,
                  generationTime: data.stats.eval_duration
                    ? data.stats.eval_duration / 1e9
                    : undefined,
                  totalTime: data.stats.total_duration
                    ? data.stats.total_duration / 1e9
                    : undefined,
                }
                setCurrentStats(stats)
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }

        if (!hasReceivedContent) {
          throw new Error("No content received from the model")
        }

        const completeMessages = [
          ...newMessages,
          { role: "assistant", content, model: selectedModel, stats },
        ] as ChatMessage[]

        setMessages(completeMessages)
        setStreamingContent("")
        setCurrentStats(undefined)
        retryCountRef.current = 0

        // Save after complete response
        const saved = ChatStorage.save(completeMessages, selectedModel)
        if (!saved) {
          addToast({
            message: "Warning: Chat history could not be saved",
            type: "warning",
            duration: 4000,
          })
        }

        // Check if nearing storage limit
        if (ChatStorage.isNearLimit()) {
          addToast({
            message:
              "Chat history is getting large. Consider exporting and clearing old messages.",
            type: "warning",
            duration: 6000,
          })
        }

        endTimer()
      } catch (err: unknown) {
        endTimer()

        if (err instanceof Error && err.name === "AbortError") {
          // User cancelled - already handled in cancelGeneration
          return
        }

        const ollamaError = parseOllamaError(err)
        setLastFailedMessage(messageText)

        // Add error message to chat
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `⚠️ Error: ${ollamaError.message}${
              retryCountRef.current < maxRetries
                ? "\n\n*You can retry this message using Ctrl+R*"
                : ""
            }`,
            model: selectedModel,
          },
        ])

        addToast({
          message: ollamaError.message,
          type: "error",
          duration: 7000,
        })

        if (ollamaError.details) {
          console.error("Error details:", ollamaError.details)
        }
      } finally {
        setLoading(false)
        abortControllerRef.current = null

        if (streamingTimeoutRef.current) {
          clearTimeout(streamingTimeoutRef.current)
          streamingTimeoutRef.current = null
        }
      }
    },
    [
      loading,
      isConnected,
      messages,
      selectedModel,
      systemPrompt,
      addToast,
      startTimer,
      streamingContent,
    ]
  )

  // Send message function
  const sendMessage = useCallback(async () => {
    await sendMessageCore(input)
  }, [input, sendMessageCore])

  // Retry last message function
  const retryLastMessage = useCallback(async () => {
    if (!lastFailedMessage || retryCountRef.current >= maxRetries) return

    retryCountRef.current += 1
    addToast({
      message: `Retrying message (attempt ${retryCountRef.current}/${maxRetries})...`,
      type: "info",
      duration: 3000,
    })

    await sendMessageCore(lastFailedMessage, true)
  }, [lastFailedMessage, sendMessageCore, addToast])

  return {
    // State
    messages,
    input,
    setInput,
    loading,
    streamingContent,
    currentStats,

    // Actions
    sendMessage,
    clearChat,
    exportChat,
    cancelGeneration,
    retryLastMessage,
    editMessage,
    deleteMessage,

    // Status
    isNearStorageLimit,
    messageCount,
    canRetry,
  }
}
