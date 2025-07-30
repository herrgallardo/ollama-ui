"use client"

import { forwardRef, useImperativeHandle, useRef } from "react"
import Image from "next/image"
import type { Model, SystemPromptKey, ChatMessage } from "@/app/types/chat"

interface ChatHeaderProps {
  isConnected: boolean
  models: Model[]
  selectedModel: string
  onModelChange: (model: string) => void
  systemPrompt: SystemPromptKey
  onSystemPromptChange: (prompt: SystemPromptKey) => void
  messages: ChatMessage[]
  onClearChat: () => void
  onExportChat: () => void
  onShowShortcuts: () => void
}

export interface ChatHeaderRefs {
  modelSelectRef: React.RefObject<HTMLSelectElement | null>
  promptSelectRef: React.RefObject<HTMLSelectElement | null>
}

const ChatHeader = forwardRef<ChatHeaderRefs, ChatHeaderProps>(
  (
    {
      isConnected,
      models,
      selectedModel,
      onModelChange,
      systemPrompt,
      onSystemPromptChange,
      messages,
      onClearChat,
      onExportChat,
      onShowShortcuts,
    },
    ref
  ) => {
    // Sort models for consistent display
    const sortedModels = [...models].sort((a, b) =>
      a.name.localeCompare(b.name)
    )

    // Create internal refs
    const modelSelectRef = useRef<HTMLSelectElement>(null)
    const promptSelectRef = useRef<HTMLSelectElement>(null)

    // Expose refs through imperative handle
    useImperativeHandle(ref, () => ({
      modelSelectRef,
      promptSelectRef,
    }))

    return (
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
              ref={modelSelectRef}
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              disabled={!isConnected || !sortedModels.length}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Press Ctrl+M to focus"
            >
              {sortedModels.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name} ({(model.size / 1e9).toFixed(1)}GB)
                </option>
              ))}
            </select>

            {/* System Prompt */}
            <select
              ref={promptSelectRef}
              value={systemPrompt}
              onChange={(e) =>
                onSystemPromptChange(e.target.value as SystemPromptKey)
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              title="Press Ctrl+P to focus"
            >
              <option value="default">Default</option>
              <option value="coder">Coder</option>
              <option value="teacher">Teacher</option>
              <option value="creative">Creative</option>
            </select>

            {/* Actions */}
            <button
              onClick={onClearChat}
              disabled={!messages.length}
              className="group px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
              title="Ctrl+K"
            >
              Clear
              <kbd className="hidden sm:inline px-2 py-0.5 text-xs font-mono font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-500 shadow-sm whitespace-nowrap group-hover:bg-gray-300 dark:group-hover:bg-gray-500 transition-all">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={onExportChat}
              disabled={!messages.length}
              className="group px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
              title="Ctrl+E"
            >
              Export
              <kbd className="hidden sm:inline px-2 py-0.5 text-xs font-mono font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-500 shadow-sm whitespace-nowrap group-hover:bg-gray-300 dark:group-hover:bg-gray-500 transition-all">
                ⌘E
              </kbd>
            </button>

            <button
              onClick={onShowShortcuts}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
              title="Keyboard shortcuts (Ctrl+H)"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }
)

ChatHeader.displayName = "ChatHeader"

export default ChatHeader
