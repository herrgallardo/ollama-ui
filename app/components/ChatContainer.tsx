"use client"

import { forwardRef, useImperativeHandle, useRef, useEffect } from "react"
import Message from "./Message"
import type { ChatMessage, ChatStats } from "@/app/types/chat"

interface ChatContainerProps {
  messages: ChatMessage[]
  streamingContent: string
  currentStats?: ChatStats
  selectedModel: string
}

export interface ChatContainerRefs {
  messagesEndRef: React.RefObject<HTMLDivElement | null>
}

const ChatContainer = forwardRef<ChatContainerRefs, ChatContainerProps>(
  ({ messages, streamingContent, currentStats, selectedModel }, ref) => {
    // Create internal ref
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Expose ref through imperative handle
    useImperativeHandle(ref, () => ({
      messagesEndRef,
    }))

    // Auto-scroll to bottom when messages or streaming content changes
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, streamingContent])

    return (
      <div className="overflow-y-auto p-6 flex-1">
        {/* Empty State */}
        {messages.length === 0 && !streamingContent && (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
            <p className="text-xl mb-2">Welcome to Local AI Chat</p>
            <p className="text-sm">Start a conversation with {selectedModel}</p>
            <p className="text-xs mt-4">
              Press{" "}
              <kbd className="px-2 py-1 text-xs font-mono font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 shadow-sm whitespace-nowrap transition-all">
                Ctrl+H
              </kbd>{" "}
              to see keyboard shortcuts
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, idx) => (
          <Message key={idx} {...msg} />
        ))}

        {/* Streaming Content */}
        {streamingContent && (
          <Message
            role="assistant"
            content={streamingContent}
            model={selectedModel}
            stats={currentStats}
          />
        )}

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    )
  }
)

ChatContainer.displayName = "ChatContainer"

export default ChatContainer
