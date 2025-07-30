"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { parseOllamaError } from "@/app/utils/errorHandler"
import { ChatStorage } from "@/app/utils/chatStorage"
import { SYSTEM_PROMPTS, CHAT_EXPORT_PREFIX } from "@/app/constants/prompts"
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

  // Status
  isNearStorageLimit: boolean
}

export function useChat({
  selectedModel,
  systemPrompt,
  isConnected,
  addToast,
}: UseChatProps): UseChatReturn {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const [currentStats, setCurrentStats] = useState<ChatMessage["stats"]>()

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null)

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
  }, []) // Only run on mount, not dependent on addToast

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

  // Clear chat function
  const clearChat = useCallback(() => {
    setMessages([])
    setStreamingContent("")
    setCurrentStats(undefined)
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
            content: streamingContent,
            model: selectedModel,
          },
        ] as ChatMessage[]

        setMessages(completeMessages)
        setStreamingContent("")
        setCurrentStats(undefined)

        // Save cancelled message
        ChatStorage.save(completeMessages, selectedModel)
      }
    }
  }, [messages, streamingContent, selectedModel])

  // Send message function
  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return

    if (!isConnected) {
      addToast({
        message: "Cannot send message: Ollama is not connected",
        type: "error",
      })
      return
    }

    const userMessage: ChatMessage = { role: "user", content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    setLoading(true)
    setStreamingContent("")
    setCurrentStats(undefined)
    abortControllerRef.current = new AbortController()

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
        throw new Error(errorData.error || "Failed to get response")
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let content = ""
      let stats: ChatMessage["stats"] = {}

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n").filter((line) => line.trim())

        for (const line of lines) {
          try {
            const data = JSON.parse(line)

            if (data.content) {
              content += data.content
              setStreamingContent(content)
            }

            if (data.stats) {
              // Calculate tokens per second
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

      const completeMessages = [
        ...newMessages,
        { role: "assistant", content, model: selectedModel, stats },
      ] as ChatMessage[]

      setMessages(completeMessages)
      setStreamingContent("")
      setCurrentStats(undefined)

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
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        // User cancelled - not an error
        addToast({
          message: "Generation cancelled",
          type: "info",
          duration: 3000,
        })
      } else {
        const ollamaError = parseOllamaError(err)

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `⚠️ Error: ${ollamaError.message}`,
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
      }
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [
    input,
    loading,
    isConnected,
    messages,
    selectedModel,
    systemPrompt,
    addToast,
  ])

  // Calculate if near storage limit
  const isNearStorageLimit = ChatStorage.isNearLimit()

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

    // Status
    isNearStorageLimit,
  }
}
