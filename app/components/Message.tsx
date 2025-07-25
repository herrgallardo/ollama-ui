"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import type { Components } from "react-markdown"
import type { CSSProperties } from "react"

interface MessageProps {
  role: "user" | "assistant" | "system"
  content: string
  model?: string
}

// Type assertion for the style to match SyntaxHighlighter's expected type
const syntaxStyle = vscDarkPlus as { [key: string]: CSSProperties }

export default function Message({ role, content, model }: MessageProps) {
  const components: Components = {
    code({ node, className, children, ...props }) {
      const inline = node?.position
        ? node.position.start.line === node.position.end.line
        : false
      const match = /language-(\w+)/.exec(className || "")

      return !inline && match ? (
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
      ) : (
        <code
          className={`${className || ""} bg-gray-200 dark:bg-gray-700 px-1 rounded text-sm`}
          {...props}
        >
          {children}
        </code>
      )
    },
  }

  return (
    <div
      className={`flex ${role === "user" ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`max-w-[80%] rounded-lg p-4 ${
          role === "user"
            ? "bg-blue-500 text-white"
            : role === "system"
              ? "bg-yellow-100 text-yellow-900 border border-yellow-300"
              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold">
            {role === "user"
              ? "You"
              : role === "system"
                ? "System"
                : model || "Assistant"}
          </p>
        </div>

        {role === "user" ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
              {content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
