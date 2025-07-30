"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import Message from "./components/Message"
import ChatHeader, { type ChatHeaderRefs } from "./components/ChatHeader"
import KeyboardShortcuts from "./components/KeyboardShortcuts"
import { useToast } from "./hooks/useToast"
import {
  useKeyboardShortcuts,
  type ShortcutConfig,
} from "./hooks/useKeyboardShortcuts"
import { parseOllamaError } from "./utils/errorHandler"
import { ChatStorage } from "./utils/chatStorage"
import type { ChatMessage, Model, SystemPromptKey } from "./types/chat"
import {
  SYSTEM_PROMPTS,
  DEFAULT_MODEL,
  CONNECTION_CHECK_INTERVAL,
  CHAT_EXPORT_PREFIX,
} from "./constants/prompts"

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [models, setModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL)
  const [systemPrompt, setSystemPrompt] = useState<SystemPromptKey>("default")
  const [isConnected, setIsConnected] = useState(true)
  const [streamingContent, setStreamingContent] = useState("")
  const [currentStats, setCurrentStats] = useState<ChatMessage["stats"]>()
  const [showShortcuts, setShowShortcuts] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const headerRef = useRef<ChatHeaderRefs>(null)
  const { addToast } = useToast()
  const hasShownDisconnectToast = useRef(false)

  // Memoize sorted models
  const sortedModels = useMemo(
    () => [...models].sort((a, b) => a.name.localeCompare(b.name)),
    [models]
  )

  // Define functions with useCallback to avoid recreating them
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

  // Define keyboard shortcuts
  const shortcuts: ShortcutConfig[] = useMemo(
    () => [
      {
        key: "k",
        ctrl: true,
        description: "Clear chat",
        handler: () => {
          if (messages.length > 0) {
            clearChat()
          }
        },
        enabled: messages.length > 0,
      },
      {
        key: "e",
        ctrl: true,
        description: "Export chat",
        handler: () => {
          if (messages.length > 0) {
            exportChat()
          }
        },
        enabled: messages.length > 0,
      },
      {
        key: "h",
        ctrl: true,
        description: "Show keyboard shortcuts",
        handler: () => setShowShortcuts(true),
      },
      {
        key: "?",
        ctrl: true,
        description: "Show keyboard shortcuts",
        handler: () => setShowShortcuts(true),
      },
      {
        key: "F1",
        description: "Show keyboard shortcuts",
        handler: () => setShowShortcuts(true),
      },
      {
        key: "l",
        ctrl: true,
        description: "Focus message input",
        handler: () => inputRef.current?.focus(),
      },
      {
        key: "m",
        ctrl: true,
        description: "Open model selector",
        handler: () => headerRef.current?.modelSelectRef.current?.focus(),
        enabled: isConnected && sortedModels.length > 0,
      },
      {
        key: "p",
        ctrl: true,
        description: "Open prompt selector",
        handler: () => headerRef.current?.promptSelectRef.current?.focus(),
      },
      {
        key: "Escape",
        description: "Cancel generation",
        handler: () => {
          if (loading) {
            cancelGeneration()
          }
        },
        enabled: loading,
      },
    ],
    [
      messages.length,
      loading,
      isConnected,
      sortedModels.length,
      clearChat,
      exportChat,
      cancelGeneration,
    ]
  )

  // Use keyboard shortcuts
  useKeyboardShortcuts({ shortcuts })

  // Load chat history on mount
  useEffect(() => {
    const stored = ChatStorage.load()
    if (stored && stored.messages.length > 0) {
      setMessages(stored.messages)
      if (stored.model) {
        setSelectedModel(stored.model)
      }
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

  // Fetch models and connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch("/api/models", {
          method: "GET",
          signal: AbortSignal.timeout(5000), // 5 second timeout
        })

        if (!response.ok) {
          // Server responded with error
          setIsConnected(false)
          setModels([])

          if (!hasShownDisconnectToast.current) {
            hasShownDisconnectToast.current = true
            addToast({
              message:
                "Ollama server error. Please check if Ollama is running properly.",
              type: "error",
              duration: 5000,
            })
          }
          return
        }

        const data = await response.json()

        if (data.models?.length) {
          setModels(data.models)
          setIsConnected(true)
          hasShownDisconnectToast.current = false

          // Show success toast only on reconnection after being disconnected
          if (!isConnected) {
            addToast({
              message: "Connected to Ollama",
              type: "success",
              duration: 3000,
            })
          }

          // Check if selected model is still available
          if (!data.models.some((m: Model) => m.name === selectedModel)) {
            const firstModel = data.models[0].name
            setSelectedModel(firstModel)
            addToast({
              message: `Model ${selectedModel} not found, switched to ${firstModel}`,
              type: "warning",
              duration: 4000,
            })
          }
        } else {
          // No models available
          setIsConnected(false)
          setModels([])

          if (!hasShownDisconnectToast.current) {
            hasShownDisconnectToast.current = true
            addToast({
              message:
                "No models found. Please pull a model using 'ollama pull <model>'",
              type: "warning",
              duration: 5000,
            })
          }
        }
      } catch (error) {
        // Network error or timeout - Ollama not reachable
        setIsConnected(false)
        setModels([])

        // Only show toast once per disconnect
        if (!hasShownDisconnectToast.current) {
          hasShownDisconnectToast.current = true

          if (error instanceof Error && error.name === "AbortError") {
            addToast({
              message: "Connection timeout. Please check if Ollama is running.",
              type: "error",
              duration: 5000,
            })
          } else {
            addToast({
              message:
                "Cannot connect to Ollama. Please run 'ollama serve' to start it.",
              type: "error",
              duration: 5000,
            })
          }
        }
      }
    }

    // Check immediately
    checkConnection()

    // Then check periodically
    const interval = setInterval(checkConnection, CONNECTION_CHECK_INTERVAL)

    return () => clearInterval(interval)
  }, [selectedModel, isConnected, addToast])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  const sendMessage = async () => {
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
  }

  return (
    <main className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <ChatHeader
        ref={headerRef}
        isConnected={isConnected}
        models={sortedModels}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        systemPrompt={systemPrompt}
        onSystemPromptChange={setSystemPrompt}
        messages={messages}
        onClearChat={clearChat}
        onExportChat={exportChat}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

      {/* Chat Container */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg h-[calc(100vh-200px)] flex flex-col">
          <div className="overflow-y-auto p-6 flex-1">
            {messages.length === 0 && !streamingContent && (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
                <p className="text-xl mb-2">Welcome to Local AI Chat</p>
                <p className="text-sm">
                  Start a conversation with {selectedModel}
                </p>
                <p className="text-xs mt-4">
                  Press{" "}
                  <kbd className="px-2 py-1 text-xs font-mono font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 shadow-sm whitespace-nowrap transition-all">
                    Ctrl+H
                  </kbd>{" "}
                  to see keyboard shortcuts
                </p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <Message key={idx} {...msg} />
            ))}
            {streamingContent && (
              <Message
                role="assistant"
                content={streamingContent}
                model={selectedModel}
                stats={currentStats}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            {/* Live Stats Display */}
            {loading && currentStats && (
              <div className="mb-3 flex gap-4 text-xs text-gray-600 dark:text-gray-400">
                {currentStats.tokensPerSecond && (
                  <span>⚡ {currentStats.tokensPerSecond} tokens/sec</span>
                )}
                {currentStats.totalTokens && (
                  <span>📊 {currentStats.totalTokens} tokens generated</span>
                )}
                {currentStats.generationTime && (
                  <span>⏱️ {currentStats.generationTime.toFixed(1)}s</span>
                )}
              </div>
            )}
            <div className="flex gap-4">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && !loading && sendMessage()
                }
                placeholder={
                  isConnected
                    ? "Type your message..."
                    : "Ollama is not connected..."
                }
                disabled={loading || !isConnected}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
              {loading ? (
                <button
                  onClick={cancelGeneration}
                  className="group px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center gap-2"
                  title="Press Escape to cancel"
                >
                  Stop
                  <kbd className="hidden sm:inline px-2 py-0.5 text-xs font-mono font-medium bg-red-600/50 text-white rounded border border-red-400/50 shadow-sm whitespace-nowrap group-hover:bg-red-700/50 transition-all">
                    Esc
                  </kbd>
                </button>
              ) : (
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || !isConnected}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  title="Press Enter to send"
                >
                  Send
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcuts
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={shortcuts}
      />
    </main>
  )
}
