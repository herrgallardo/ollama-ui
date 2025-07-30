"use client"

import { forwardRef, useImperativeHandle, useRef } from "react"
import type { ChatStats } from "@/app/types/chat"

interface ChatInputProps {
  input: string
  onInputChange: (value: string) => void
  loading: boolean
  onSend: () => void
  onCancel: () => void
  isConnected: boolean
  currentStats?: ChatStats
}

export interface ChatInputRefs {
  inputRef: React.RefObject<HTMLInputElement | null>
}

const ChatInput = forwardRef<ChatInputRefs, ChatInputProps>(
  (
    {
      input,
      onInputChange,
      loading,
      onSend,
      onCancel,
      isConnected,
      currentStats,
    },
    ref
  ) => {
    // Create internal ref
    const inputRef = useRef<HTMLInputElement>(null)

    // Expose ref through imperative handle
    useImperativeHandle(ref, () => ({
      inputRef,
    }))

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !loading) {
        onSend()
      }
    }

    const canSend = input.trim() && isConnected && !loading

    return (
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
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
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
              onClick={onCancel}
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
              onClick={onSend}
              disabled={!canSend}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              title="Press Enter to send"
            >
              Send
            </button>
          )}
        </div>
      </div>
    )
  }
)

ChatInput.displayName = "ChatInput"

export default ChatInput
