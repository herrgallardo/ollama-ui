"use client"

import { useEffect } from "react"
import {
  formatShortcut,
  type ShortcutConfig,
} from "@/app/hooks/useKeyboardShortcuts"

interface KeyboardShortcutsProps {
  isOpen: boolean
  onClose: () => void
  shortcuts: ShortcutConfig[]
}

export default function KeyboardShortcuts({
  isOpen,
  onClose,
  shortcuts,
}: KeyboardShortcutsProps) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="space-y-4">
            {shortcuts
              .filter(
                (shortcut, index, self) =>
                  // Remove duplicates based on description
                  index ===
                  self.findIndex((s) => s.description === shortcut.description)
              )
              .map((shortcut, index) => {
                // Find all shortcuts with the same description
                const alternativeShortcuts = shortcuts.filter(
                  (s) => s.description === shortcut.description
                )

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {shortcut.description}
                    </span>
                    <div className="flex gap-2">
                      {alternativeShortcuts.map((alt, altIndex) => (
                        <kbd
                          key={altIndex}
                          className="px-3 py-1 text-sm font-mono font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 shadow-sm whitespace-nowrap transition-all"
                        >
                          {formatShortcut(alt)}
                        </kbd>
                      ))}
                    </div>
                  </div>
                )
              })}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Press{" "}
              <kbd className="px-2 py-1 text-xs font-mono font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 shadow-sm whitespace-nowrap transition-all">
                Esc
              </kbd>{" "}
              to close this dialog
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
