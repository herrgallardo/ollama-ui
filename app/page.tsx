"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import ChatHeader, { type ChatHeaderRefs } from "./components/ChatHeader"
import ChatContainer, {
  type ChatContainerRefs,
} from "./components/ChatContainer"
import ChatInput, { type ChatInputRefs } from "./components/ChatInput"
import KeyboardShortcuts from "./components/KeyboardShortcuts"
import { useToast } from "./hooks/useToast"
import { useChat } from "./hooks/useChat"
import {
  useKeyboardShortcuts,
  type ShortcutConfig,
} from "./hooks/useKeyboardShortcuts"
import type { Model, SystemPromptKey } from "./types/chat"
import { DEFAULT_MODEL, CONNECTION_CHECK_INTERVAL } from "./constants/prompts"

export default function Home() {
  // Connection and model state
  const [models, setModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL)
  const [systemPrompt, setSystemPrompt] = useState<SystemPromptKey>("default")
  const [isConnected, setIsConnected] = useState(true)
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Refs
  const chatContainerRef = useRef<ChatContainerRefs>(null)
  const chatInputRef = useRef<ChatInputRefs>(null)
  const headerRef = useRef<ChatHeaderRefs>(null)
  const { addToast } = useToast()
  const hasShownDisconnectToast = useRef(false)

  // Chat logic hook
  const {
    messages,
    input,
    setInput,
    loading,
    streamingContent,
    currentStats,
    sendMessage,
    clearChat,
    exportChat,
    cancelGeneration,
  } = useChat({
    selectedModel,
    systemPrompt,
    isConnected,
    addToast,
  })

  // Memoize sorted models
  const sortedModels = useMemo(
    () => [...models].sort((a, b) => a.name.localeCompare(b.name)),
    [models]
  )

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
        handler: () => chatInputRef.current?.inputRef.current?.focus(),
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
          {/* Messages Display */}
          <ChatContainer
            ref={chatContainerRef}
            messages={messages}
            streamingContent={streamingContent}
            currentStats={currentStats}
            selectedModel={selectedModel}
          />

          {/* Chat Input */}
          <ChatInput
            ref={chatInputRef}
            input={input}
            onInputChange={setInput}
            loading={loading}
            onSend={sendMessage}
            onCancel={cancelGeneration}
            isConnected={isConnected}
            currentStats={currentStats}
          />
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
