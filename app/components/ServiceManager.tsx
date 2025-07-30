"use client"

import { useState } from "react"
import { useToast } from "@/app/hooks/useToast"

interface ServiceCommand {
  label: string
  command: string
  description: string
  icon: string
}

interface ServiceManagerProps {
  isConnected: boolean
}

export default function ServiceManager({ isConnected }: ServiceManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { addToast } = useToast()

  const commands: ServiceCommand[] = [
    {
      label: "Start Ollama",
      command: "sudo systemctl start ollama",
      description: "Start the Ollama service",
      icon: "▶️",
    },
    {
      label: "Stop Ollama",
      command: "sudo systemctl stop ollama",
      description: "Stop the Ollama service",
      icon: "⏹️",
    },
    {
      label: "Restart Ollama",
      command: "sudo systemctl restart ollama",
      description: "Restart the Ollama service",
      icon: "🔄",
    },
    {
      label: "Check Status",
      command: "sudo systemctl status ollama",
      description: "Check Ollama service status",
      icon: "📊",
    },
    {
      label: "Enable Auto-start",
      command: "sudo systemctl enable ollama",
      description: "Enable Ollama to start on boot",
      icon: "🚀",
    },
    {
      label: "Disable Auto-start",
      command: "sudo systemctl disable ollama",
      description: "Disable Ollama auto-start on boot",
      icon: "🛑",
    },
  ]

  const handleCopyCommand = async (command: string, label: string) => {
    try {
      await navigator.clipboard.writeText(command)
      addToast({
        message: `Command copied: ${label}`,
        type: "success",
        duration: 3000,
      })
    } catch {
      // Fallback for older browsers
      try {
        const textArea = document.createElement("textarea")
        textArea.value = command
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        textArea.style.top = "-999999px"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand("copy")
        textArea.remove()

        addToast({
          message: `Command copied: ${label}`,
          type: "success",
          duration: 3000,
        })
      } catch (fallbackErr) {
        console.error("Failed to copy command:", fallbackErr)
        addToast({
          message: "Failed to copy command",
          type: "error",
          duration: 3000,
        })
      }
    }
  }

  const getRecommendedCommand = () => {
    if (!isConnected) {
      return commands[0] // Start Ollama
    }
    return commands[2] // Restart Ollama
  }

  const recommendedCommand = getRecommendedCommand()

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
          isConnected
            ? "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
            : "text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
        }`}
        title={
          isConnected ? "Service management" : "Ollama service not running"
        }
        aria-label="Service management options"
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
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Ollama Service Management
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Copy commands to manage the Ollama service
              </p>
            </div>

            {/* Quick Action */}
            {!isConnected && (
              <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 dark:text-red-400">⚠️</span>
                    <span className="text-sm font-medium text-red-900 dark:text-red-200">
                      Recommended Action
                    </span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleCopyCommand(
                      recommendedCommand.command,
                      recommendedCommand.label
                    )
                  }
                  className="mt-2 w-full flex items-center justify-between px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <div className="flex items-center gap-2">
                    <span>{recommendedCommand.icon}</span>
                    <span className="text-sm font-medium">
                      {recommendedCommand.label}
                    </span>
                  </div>
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
                </button>
              </div>
            )}

            {/* All Commands */}
            <div className="max-h-64 overflow-y-auto">
              {commands.map((cmd, index) => (
                <button
                  key={index}
                  onClick={() => handleCopyCommand(cmd.command, cmd.label)}
                  className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{cmd.icon}</span>
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {cmd.label}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {cmd.description}
                        </div>
                      </div>
                    </div>
                    <svg
                      className="w-4 h-4 text-gray-400 dark:text-gray-500"
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
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                💡 <strong>Tip:</strong> Paste these commands in your terminal
                to manage the Ollama service
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
