"use client"

import { useState } from "react"
import { useToast } from "@/app/hooks/useToast"
import {
  Cog6ToothIcon,
  ClipboardDocumentIcon,
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  DocumentTextIcon,
  ListBulletIcon,
  ComputerDesktopIcon,
  InformationCircleIcon,
  WindowIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ServerIcon,
  CommandLineIcon,
  RectangleGroupIcon,
} from "@heroicons/react/24/outline"

interface ServiceCommand {
  label: string
  command: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

interface PlatformCommands {
  name: string
  icon: React.ComponentType<{ className?: string }>
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
      icon: ServerIcon,
      commands: [
        {
          label: "Start Ollama",
          command: "sudo systemctl start ollama",
          description: "Start the Ollama service",
          icon: PlayIcon,
        },
        {
          label: "Stop Ollama",
          command: "sudo systemctl stop ollama",
          description: "Stop the Ollama service",
          icon: StopIcon,
        },
        {
          label: "Restart Ollama",
          command: "sudo systemctl restart ollama",
          description: "Restart the Ollama service",
          icon: ArrowPathIcon,
        },
        {
          label: "Check Status",
          command: "sudo systemctl status ollama",
          description: "Check Ollama service status",
          icon: ChartBarIcon,
        },
        {
          label: "Enable Auto-start",
          command: "sudo systemctl enable ollama",
          description: "Enable Ollama to start on boot",
          icon: RocketLaunchIcon,
        },
        {
          label: "View Logs",
          command: "sudo journalctl -u ollama -f",
          description: "View Ollama service logs",
          icon: DocumentTextIcon,
        },
      ],
      note: "For systemd-based Linux distributions (Ubuntu, Debian, Fedora, etc.)",
    },
    macos: {
      name: "macOS",
      icon: CommandLineIcon,
      commands: [
        {
          label: "Start Ollama",
          command: "brew services start ollama",
          description: "Start Ollama via Homebrew",
          icon: PlayIcon,
        },
        {
          label: "Stop Ollama",
          command: "brew services stop ollama",
          description: "Stop Ollama via Homebrew",
          icon: StopIcon,
        },
        {
          label: "Restart Ollama",
          command: "brew services restart ollama",
          description: "Restart Ollama via Homebrew",
          icon: ArrowPathIcon,
        },
        {
          label: "List Services",
          command: "brew services list",
          description: "List all Homebrew services",
          icon: ListBulletIcon,
        },
        {
          label: "Start (Manual)",
          command: "ollama serve",
          description: "Start Ollama manually in terminal",
          icon: ComputerDesktopIcon,
        },
        {
          label: "Check Version",
          command: "ollama --version",
          description: "Check installed Ollama version",
          icon: InformationCircleIcon,
        },
      ],
      note: "Requires Ollama installed via Homebrew. For manual install, use 'ollama serve'",
    },
    windows: {
      name: "Windows",
      icon: RectangleGroupIcon,
      commands: [
        {
          label: "Start Ollama",
          command: "ollama serve",
          description: "Start Ollama in terminal",
          icon: PlayIcon,
        },
        {
          label: "Start (Background)",
          command:
            "Start-Process ollama -ArgumentList 'serve' -WindowStyle Hidden",
          description: "Start Ollama in background (PowerShell)",
          icon: WindowIcon,
        },
        {
          label: "Check if Running",
          command: "Get-Process ollama -ErrorAction SilentlyContinue",
          description: "Check if Ollama is running (PowerShell)",
          icon: MagnifyingGlassIcon,
        },
        {
          label: "Stop Ollama",
          command: "Stop-Process -Name ollama -Force",
          description: "Stop Ollama process (PowerShell)",
          icon: StopIcon,
        },
        {
          label: "List Models",
          command: "ollama list",
          description: "List installed models",
          icon: ListBulletIcon,
        },
        {
          label: "Check Version",
          command: "ollama --version",
          description: "Check installed Ollama version",
          icon: InformationCircleIcon,
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
        <Cog6ToothIcon className="w-5 h-5" />
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
                (platform) => {
                  const PlatformIcon = platforms[platform].icon
                  return (
                    <button
                      key={platform}
                      onClick={() => setSelectedPlatform(platform)}
                      className={`flex-1 px-4 py-2.5 text-sm font-medium transition-all focus:outline-none flex items-center justify-center gap-1.5 ${
                        selectedPlatform === platform
                          ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
                          : "bg-gray-50 dark:bg-gray-750 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }`}
                    >
                      <PlatformIcon className="w-4 h-4" />
                      {platforms[platform].name}
                    </button>
                  )
                }
              )}
            </div>

            {/* Quick Action for disconnected state */}
            {!isConnected && (
              <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
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
                    {recommendedCommand.icon && (
                      <recommendedCommand.icon className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {recommendedCommand.label}
                    </span>
                  </div>
                  <ClipboardDocumentIcon className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Commands List */}
            <div className="max-h-80 overflow-y-auto">
              {currentPlatform.commands.map((cmd, index) => {
                const CommandIcon = cmd.icon
                return (
                  <button
                    key={index}
                    onClick={() => handleCopyCommand(cmd.command, cmd.label)}
                    className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CommandIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
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
                      <ClipboardDocumentIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Footer with platform-specific note */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700">
              {currentPlatform.note && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  <strong>Note:</strong> {currentPlatform.note}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                <LightBulbIcon className="w-3 h-3" />
                <strong>Tip:</strong> Click any command to copy it to your
                clipboard
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
