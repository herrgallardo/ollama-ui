"use client"

import { useState, memo, useMemo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import type { Components } from "react-markdown"
import type { CSSProperties } from "react"
import type { ChatMessage } from "@/app/types/chat"
import { useToast } from "@/app/hooks/useToast"

// Type assertion for the style to match SyntaxHighlighter's expected type
const syntaxStyle = vscDarkPlus as { [key: string]: CSSProperties }

interface MessageProps extends ChatMessage {
  isLatest?: boolean
}

function MessageComponent({
  role,
  content,
  model,
  stats,
  isLatest = false,
}: MessageProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const { addToast } = useToast()

  const handleCopy = async () => {
    if (isCopying) return

    setIsCopying(true)
    try {
      await navigator.clipboard.writeText(content)
      addToast({
        message: "Message copied to clipboard",
        type: "success",
        duration: 2000,
      })
    } catch {
      // Fallback for older browsers
      try {
        const textArea = document.createElement("textarea")
        textArea.value = content
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        textArea.style.top = "-999999px"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand("copy")
        textArea.remove()

        addToast({
          message: "Message copied to clipboard",
          type: "success",
          duration: 2000,
        })
      } catch (fallbackErr) {
        console.error("Failed to copy message:", fallbackErr)
        addToast({
          message: "Failed to copy message",
          type: "error",
          duration: 3000,
        })
      }
    } finally {
      setIsCopying(false)
    }
  }

  // Memoize the markdown components to prevent recreation on every render
  const components: Components = useMemo(
    () => ({
      code({ node, className, children, ...props }) {
        const inline = node?.position
          ? node.position.start.line === node.position.end.line
          : false
        const match = /language-(\w+)/.exec(className || "")

        return !inline && match ? (
          <div className="relative group">
            <SyntaxHighlighter
              style={syntaxStyle}
              language={match[1]}
              PreTag="div"
              customStyle={{
                margin: 0,
                borderRadius: "0.375rem",
                fontSize: "0.875rem",
              }}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
            {/* Copy button for code blocks */}
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(String(children))
                  addToast({
                    message: "Code copied to clipboard",
                    type: "success",
                    duration: 2000,
                  })
                } catch {
                  addToast({
                    message: "Failed to copy code",
                    type: "error",
                    duration: 3000,
                  })
                }
              }}
              className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded opacity-0 group-hover:opacity-100 transition-all duration-200 text-xs"
              title="Copy code"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        ) : (
          <code
            className={`${className || ""} bg-gray-200 dark:bg-gray-700 px-1 rounded text-sm`}
            {...props}
          >
            {children}
          </code>
        )
      },
      // Optimize link rendering
      a({ href, children, ...props }) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
            {...props}
          >
            {children}
            <svg
              className="inline w-3 h-3 ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        )
      },
    }),
    [addToast]
  )

  // Memoize stats display
  const statsDisplay = useMemo(() => {
    if (role !== "assistant" || !stats) return null

    return (
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
          {stats.tokensPerSecond !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-green-600 dark:text-green-400">⚡</span>
              <span>{stats.tokensPerSecond} tokens/sec</span>
            </div>
          )}
          {stats.promptTokensPerSecond !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-blue-600 dark:text-blue-400">📥</span>
              <span>{stats.promptTokensPerSecond} prompt tokens/sec</span>
            </div>
          )}
          {stats.totalTokens !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-purple-600 dark:text-purple-400">📊</span>
              <span>{stats.totalTokens} tokens</span>
            </div>
          )}
          {stats.promptTokens !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-orange-600 dark:text-orange-400">📝</span>
              <span>{stats.promptTokens} prompt tokens</span>
            </div>
          )}
          {stats.generationTime !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-cyan-600 dark:text-cyan-400">⏱️</span>
              <span>{stats.generationTime.toFixed(2)}s generation</span>
            </div>
          )}
          {stats.totalTime !== undefined && (
            <div className="flex items-center gap-1">
              <span className="text-gray-600 dark:text-gray-400">⏰</span>
              <span>{stats.totalTime.toFixed(2)}s total</span>
            </div>
          )}
        </div>
      </div>
    )
  }, [role, stats])

  // Memoize role display name
  const roleDisplayName = useMemo(() => {
    switch (role) {
      case "user":
        return "You"
      case "system":
        return "System"
      default:
        return model || "Assistant"
    }
  }, [role, model])

  // Animation classes for smooth entry
  const animationClass = isLatest ? "animate-fade-in-up" : ""

  return (
    <div
      className={`flex ${role === "user" ? "justify-end" : "justify-start"} mb-4 group ${animationClass}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <div
          className={`max-w-[80%] rounded-lg p-4 transition-all duration-200 ${
            role === "user"
              ? "bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg"
              : role === "system"
                ? "bg-yellow-100 text-yellow-900 border border-yellow-300 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-200 dark:border-yellow-700 dark:hover:bg-yellow-900/30"
                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-750 shadow-sm hover:shadow-md"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold flex items-center gap-2">
              {roleDisplayName}
              {role === "assistant" && (
                <span className="text-xs opacity-75 font-normal">
                  {model?.split(":")[0]}
                </span>
              )}
            </p>
          </div>

          {role === "user" ? (
            <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-gray-900 prose-pre:text-gray-100">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={components}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}

          {statsDisplay}
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          disabled={isCopying}
          className={`absolute -right-2 -top-2 p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed ${
            isHovered || role === "user"
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          }`}
          aria-label="Copy message to clipboard"
          title="Copy message"
        >
          {isCopying ? (
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

// Memoize the component to prevent unnecessary re-renders
export default memo(MessageComponent, (prevProps, nextProps) => {
  // Only re-render if content, stats, or other meaningful props change
  return (
    prevProps.role === nextProps.role &&
    prevProps.content === nextProps.content &&
    prevProps.model === nextProps.model &&
    prevProps.isLatest === nextProps.isLatest &&
    JSON.stringify(prevProps.stats) === JSON.stringify(nextProps.stats)
  )
})
