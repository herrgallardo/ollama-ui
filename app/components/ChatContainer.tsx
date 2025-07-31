"use client"

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  memo,
  useMemo,
} from "react"
import { ArrowDownIcon } from "@heroicons/react/24/solid"
import {
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  CommandLineIcon,
} from "@heroicons/react/24/outline"
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
  scrollToBottom: () => void
  scrollToTop: () => void
}

const ChatContainer = forwardRef<ChatContainerRefs, ChatContainerProps>(
  ({ messages, streamingContent, currentStats, selectedModel }, ref) => {
    // Create internal refs
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const isAutoScrolling = useRef(true)
    const lastMessageCount = useRef(messages.length)

    // Scroll functions
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      isAutoScrolling.current = true
    }

    const scrollToTop = () => {
      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" })
      isAutoScrolling.current = false
    }

    // Expose methods through imperative handle
    useImperativeHandle(ref, () => ({
      messagesEndRef,
      scrollToBottom,
      scrollToTop,
    }))

    // Handle scroll behavior
    const handleScroll = () => {
      if (!containerRef.current) return

      const { scrollTop, scrollHeight, clientHeight } = containerRef.current
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100

      // Update auto-scroll state based on user's scroll position
      isAutoScrolling.current = isNearBottom
    }

    // Auto-scroll when new messages arrive or streaming content updates
    useEffect(() => {
      if (!isAutoScrolling.current) return

      // Only scroll if we have new messages or streaming content
      const hasNewMessage = messages.length > lastMessageCount.current
      const hasStreamingContent = streamingContent.length > 0

      if (hasNewMessage || hasStreamingContent) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }

      lastMessageCount.current = messages.length
    }, [messages.length, streamingContent])

    // Memoize the rendered messages to prevent unnecessary re-renders
    const renderedMessages = useMemo(() => {
      return messages.map((msg, idx) => (
        <Message
          key={`${idx}-${msg.role}-${msg.content.slice(0, 50)}`}
          {...msg}
          isLatest={idx === messages.length - 1}
        />
      ))
    }, [messages])

    // Memoize streaming message
    const streamingMessage = useMemo(() => {
      if (!streamingContent) return null

      return (
        <Message
          role="assistant"
          content={streamingContent}
          model={selectedModel}
          stats={currentStats}
          isLatest={true}
        />
      )
    }, [streamingContent, selectedModel, currentStats])

    // Memoize empty state
    const emptyState = useMemo(() => {
      if (messages.length > 0 || streamingContent) return null

      return (
        <div className="text-center text-gray-500 dark:text-gray-400 mt-20 animate-fade-in-up">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse-slow">
              <ChatBubbleLeftRightIcon className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              Welcome to Local AI Chat
            </h3>
            <p className="text-sm mb-4">
              Start a conversation with {selectedModel}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto mb-6">
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                <LightBulbIcon className="w-4 h-4" />
                Quick tip
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200">
                Ask anything - I&apos;m here to help!
              </p>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                <CommandLineIcon className="w-4 h-4" />
                Shortcuts
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-200">
                Press{" "}
                <kbd className="px-1 py-0.5 text-xs bg-gray-300 dark:bg-gray-600 rounded">
                  Ctrl+H
                </kbd>{" "}
                for help
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-gray-400 dark:text-gray-500">
            <p>
              Press{" "}
              <kbd className="px-2 py-1 text-xs font-mono font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 shadow-sm whitespace-nowrap transition-all">
                Enter
              </kbd>{" "}
              to send messages
            </p>
            <p>
              Press{" "}
              <kbd className="px-2 py-1 text-xs font-mono font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 shadow-sm whitespace-nowrap transition-all">
                Ctrl+K
              </kbd>{" "}
              to clear chat
            </p>
          </div>
        </div>
      )
    }, [messages.length, streamingContent, selectedModel])

    return (
      <>
        <div
          ref={containerRef}
          className="overflow-y-auto p-6 flex-1 scroll-smooth"
          onScroll={handleScroll}
        >
          {emptyState}

          {/* Messages */}
          {renderedMessages}

          {/* Streaming Content */}
          {streamingMessage}

          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom button - shows when user scrolls up */}
        {!isAutoScrolling.current &&
          (messages.length > 5 || streamingContent) && (
            <div className="absolute bottom-4 right-4 z-10">
              <button
                onClick={scrollToBottom}
                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 animate-bounce-subtle focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                title="Scroll to bottom"
                aria-label="Scroll to bottom of messages"
              >
                <ArrowDownIcon className="w-5 h-5" />
              </button>
            </div>
          )}
      </>
    )
  }
)

ChatContainer.displayName = "ChatContainer"

// Memoize the entire component to prevent unnecessary re-renders
export default memo(ChatContainer, (prevProps, nextProps) => {
  return (
    prevProps.messages.length === nextProps.messages.length &&
    prevProps.streamingContent === nextProps.streamingContent &&
    prevProps.selectedModel === nextProps.selectedModel &&
    JSON.stringify(prevProps.currentStats) ===
      JSON.stringify(nextProps.currentStats) &&
    // Check if last message changed (for streaming updates)
    (prevProps.messages.length === 0 ||
      nextProps.messages.length === 0 ||
      prevProps.messages[prevProps.messages.length - 1]?.content ===
        nextProps.messages[nextProps.messages.length - 1]?.content)
  )
})
