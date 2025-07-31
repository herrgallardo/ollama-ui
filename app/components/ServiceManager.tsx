"use client"

import { useState } from "react"
import { useToast } from "@/app/hooks/useToast"

interface ServiceCommand {
  label: string
  command: string
  description: string
  icon: string
}

interface PlatformCommands {
  name: string
  icon: string
  commands: ServiceCommand[]
  note?: string
}

interface ServiceManagerProps {
  isConnected: boolean
}

export default function ServiceManager({ isConnected }: ServiceManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<
    "linux" | "macos" | "windows"
  >("linux")
  const { addToast } = useToast()

  const platforms: Record<"linux" | "macos" | "windows", PlatformCommands> = {
    linux: {
      name: "Linux",
      icon: "🐧",
      commands: [
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
          label: "View Logs",
          command: "sudo journalctl -u ollama -f",
          description: "View Ollama service logs",
          icon: "📜",
        },
      ],
      note: "For systemd-based Linux distributions (Ubuntu, Debian, Fedora, etc.)",
    },
    macos: {
      name: "macOS",
      icon: "🍎",
      commands: [
        {
          label: "Start Ollama",
          command: "brew services start ollama",
          description: "Start Ollama via Homebrew",
          icon: "▶️",
        },
        {
          label: "Stop Ollama",
          command: "brew services stop ollama",
          description: "Stop Ollama via Homebrew",
          icon: "⏹️",
        },
        {
          label: "Restart Ollama",
          command: "brew services restart ollama",
          description: "Restart Ollama via Homebrew",
          icon: "🔄",
        },
        {
          label: "List Services",
          command: "brew services list",
          description: "List all Homebrew services",
          icon: "📋",
        },
        {
          label: "Start (Manual)",
          command: "ollama serve",
          description: "Start Ollama manually in terminal",
          icon: "🖥️",
        },
        {
          label: "Check Version",
          command: "ollama --version",
          description: "Check installed Ollama version",
          icon: "ℹ️",
        },
      ],
      note: "Requires Ollama installed via Homebrew. For manual install, use 'ollama serve'",
    },
    windows: {
      name: "Windows",
      icon: "🪟",
      commands: [
        {
          label: "Start Ollama",
          command: "ollama serve",
          description: "Start Ollama in terminal",
          icon: "▶️",
        },
        {
          label: "Start (Background)",
          command:
            "Start-Process ollama -ArgumentList 'serve' -WindowStyle Hidden",
          description: "Start Ollama in background (PowerShell)",
          icon: "🔲",
        },
        {
          label: "Check if Running",
          command: "Get-Process ollama -ErrorAction SilentlyContinue",
          description: "Check if Ollama is running (PowerShell)",
          icon: "🔍",
        },
        {
          label: "Stop Ollama",
          command: "Stop-Process -Name ollama -Force",
          description: "Stop Ollama process (PowerShell)",
          icon: "⏹️",
        },
        {
          label: "List Models",
          command: "ollama list",
          description: "List installed models",
          icon: "📋",
        },
        {
          label: "Check Version",
          command: "ollama --version",
          description: "Check installed Ollama version",
          icon: "ℹ️",
        },
      ],
      note: "Run commands in Terminal, PowerShell, or Command Prompt",
    },
  }

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

  const currentPlatform = platforms[selectedPlatform]
  const recommendedCommand = currentPlatform.commands[0] // Start command

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
          <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Ollama Service Commands
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Copy commands to manage the Ollama service
              </p>
            </div>

            {/* Platform Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {(Object.keys(platforms) as Array<keyof typeof platforms>).map(
                (platform) => (
                  <button
                    key={platform}
                    onClick={() => setSelectedPlatform(platform)}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all focus:outline-none ${
                      selectedPlatform === platform
                        ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                        : "bg-gray-50 dark:bg-gray-750 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    <span className="mr-1.5">{platforms[platform].icon}</span>
                    {platforms[platform].name}
                  </button>
                )
              )}
            </div>

            {/* Quick Action for disconnected state */}
            {!isConnected && (
              <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
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
                  className="w-full flex items-center justify-between px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
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

            {/* Commands List */}
            <div className="max-h-80 overflow-y-auto">
              {currentPlatform.commands.map((cmd, index) => (
                <button
                  key={index}
                  onClick={() => handleCopyCommand(cmd.command, cmd.label)}
                  className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 group"
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
                        <code className="text-xs text-gray-500 dark:text-gray-500 font-mono mt-0.5 block group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                          {cmd.command}
                        </code>
                      </div>
                    </div>
                    <svg
                      className="w-4 h-4 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
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

            {/* Footer with platform-specific note */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700">
              {currentPlatform.note && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  <strong>Note:</strong> {currentPlatform.note}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-500">
                💡 <strong>Tip:</strong> Click any command to copy it to your
                clipboard
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
