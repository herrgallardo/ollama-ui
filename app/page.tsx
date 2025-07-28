"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import Image from "next/image"
import Message from "./components/Message"
import { useToast } from "./hooks/useToast"
import { parseOllamaError, getErrorMessage } from "./utils/errorHandler"
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { addToast } = useToast()

  // Memoize sorted models
  const sortedModels = useMemo(
    () => [...models].sort((a, b) => a.name.localeCompare(b.name)),
    [models]
  )

  // Fetch models and connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch("/api/models")
        const data = await response.json()

        if (!response.ok) {
          throw new Error("Failed to fetch models")
        }

        if (data.models?.length) {
          setModels(data.models)
          setIsConnected(true)

          // Show success toast only on reconnection
          if (!isConnected) {
            addToast({
              message: "Connected to Ollama",
              type: "success",
              duration: 3000,
            })
          }

          if (!data.models.some((m: Model) => m.name === selectedModel)) {
            setSelectedModel(data.models[0].name)
          }
        } else {
          setIsConnected(false)
          setModels([])
        }
      } catch (error) {
        setIsConnected(false)
        setModels([])

        // Only show error toast once
        if (isConnected) {
          const errorMessage = getErrorMessage(error)
          addToast({
            message: errorMessage,
            type: "error",
            duration: 7000,
          })
        }
      }
    }

    checkConnection()
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

      setMessages([
        ...newMessages,
        { role: "assistant", content, model: selectedModel, stats },
      ])
      setStreamingContent("")
      setCurrentStats(undefined)
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

  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setLoading(false)
      if (streamingContent) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: streamingContent,
            model: selectedModel,
          },
        ])
        setStreamingContent("")
        setCurrentStats(undefined)
      }
    }
  }

  const clearChat = () => {
    setMessages([])
    setStreamingContent("")
    setCurrentStats(undefined)
    addToast({
      message: "Chat cleared",
      type: "success",
      duration: 2000,
    })
  }

  const exportChat = () => {
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
  }

  return (
    <main className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/icons/llama-icon.png"
              alt="Llama Icon"
              width={64}
              height={64}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                Local AI Chat
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className={`w-2 h-2 rounded-full transition-colors ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isConnected ? "Connected to Ollama" : "Ollama not connected"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Model Selection */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={!isConnected || !sortedModels.length}
              className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sortedModels.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name} ({(model.size / 1e9).toFixed(1)}GB)
                </option>
              ))}
            </select>
            {/* System Prompt */}
            <select
              value={systemPrompt}
              onChange={(e) =>
                setSystemPrompt(e.target.value as SystemPromptKey)
              }
              className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="default">Default</option>
              <option value="coder">Coder</option>
              <option value="teacher">Teacher</option>
              <option value="creative">Creative</option>
            </select>
            {/* Actions */}
            <button
              onClick={clearChat}
              disabled={!messages.length}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 disabled:opacity-50 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={exportChat}
              disabled={!messages.length}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 disabled:opacity-50 transition-colors"
            >
              Export
            </button>
          </div>
        </div>
      </div>

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
                className="flex-1 px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {loading ? (
                <button
                  onClick={cancelGeneration}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Stop
                </button>
              ) : (
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || !isConnected}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
