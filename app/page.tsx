"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import Image from "next/image"
import Message from "./components/Message"

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

interface Model {
  name: string
  size: number
  modified_at: string
}

const SYSTEM_PROMPTS = {
  default: "",
  coder:
    "You are an expert programmer. Provide clear, concise code examples and explanations.",
  teacher:
    "You are a patient teacher. Explain concepts clearly with examples and analogies.",
  creative:
    "You are a creative writer. Be imaginative and engaging in your responses.",
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [models, setModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState("llama3.1:8b")
  const [systemPrompt, setSystemPrompt] = useState("default")
  const [isConnected, setIsConnected] = useState(true)
  const [streamingContent, setStreamingContent] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

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
        if (data.models?.length) {
          setModels(data.models)
          setIsConnected(true)
          if (!data.models.some((m: Model) => m.name === selectedModel)) {
            setSelectedModel(data.models[0].name)
          }
        } else {
          setIsConnected(false)
        }
      } catch {
        setIsConnected(false)
      }
    }
    checkConnection()
    const interval = setInterval(checkConnection, 10000)
    return () => clearInterval(interval)
  }, [selectedModel])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMessage: ChatMessage = { role: "user", content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    setLoading(true)
    setStreamingContent("")
    abortControllerRef.current = new AbortController()
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          model: selectedModel,
          systemPrompt:
            SYSTEM_PROMPTS[systemPrompt as keyof typeof SYSTEM_PROMPTS],
        }),
        signal: abortControllerRef.current.signal,
      })
      if (!res.ok) throw new Error("Failed to get response")
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let content = ""
      while (true) {
        const { done, value } = await reader!.read()
        if (done) break
        content += decoder.decode(value)
        setStreamingContent(content)
      }
      setMessages([...newMessages, { role: "assistant", content }])
      setStreamingContent("")
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "name" in err &&
        (err as { name: string }).name !== "AbortError"
      ) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "⚠️ Error: Failed to get response. Make sure Ollama is running locally.",
          },
        ])
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
          { role: "assistant", content: streamingContent },
        ])
        setStreamingContent("")
      }
    }
  }

  const clearChat = () => {
    setMessages([])
    setStreamingContent("")
  }

  const exportChat = () => {
    const text = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join("\n\n")
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `chat-${new Date().toISOString()}.txt`
    a.click()
    URL.revokeObjectURL(url)
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
                  className={`w-2 h-2 rounded-full ${
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
              className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              onChange={(e) => setSystemPrompt(e.target.value)}
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
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 transition-colors"
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
              <Message key={idx} {...msg} model={selectedModel} />
            ))}
            {streamingContent && (
              <Message
                role="assistant"
                content={streamingContent}
                model={selectedModel}
              />
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex gap-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && !e.shiftKey && !loading && sendMessage()
                }
                placeholder={
                  isConnected
                    ? "Type your message..."
                    : "Ollama is not connected..."
                }
                disabled={loading || !isConnected}
                className="flex-1 px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
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
