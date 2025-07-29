"use client"

import { useEffect, useCallback } from "react"

export interface ShortcutConfig {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  description: string
  handler: () => void
  enabled?: boolean
}

interface UseKeyboardShortcutsProps {
  shortcuts: ShortcutConfig[]
  enableGlobal?: boolean
}

export function useKeyboardShortcuts({
  shortcuts,
  enableGlobal = true,
}: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs (unless it's a global shortcut with modifiers)
      const target = event.target as HTMLElement
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true"

      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue

        const hasModifier =
          shortcut.ctrl || shortcut.shift || shortcut.alt || shortcut.meta

        // Skip if typing and no modifier keys
        if (isTyping && !hasModifier) continue

        const isMatch =
          event.key === shortcut.key &&
          (shortcut.ctrl ? event.ctrlKey || event.metaKey : true) &&
          (shortcut.shift ? event.shiftKey : !event.shiftKey) &&
          (shortcut.alt ? event.altKey : !event.altKey) &&
          (shortcut.meta ? event.metaKey : true)

        if (isMatch) {
          event.preventDefault()
          event.stopPropagation()
          shortcut.handler()
          break
        }
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    if (!enableGlobal) return

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown, enableGlobal])

  return { handleKeyDown }
}

// Utility function to format shortcut for display
export function formatShortcut(shortcut: ShortcutConfig): string {
  const isMac =
    typeof window !== "undefined" && navigator.platform.includes("Mac")
  const parts = []

  if (shortcut.ctrl) parts.push(isMac ? "⌘" : "Ctrl")
  if (shortcut.shift) parts.push("⇧")
  if (shortcut.alt) parts.push(isMac ? "⌥" : "Alt")
  if (shortcut.meta && !isMac) parts.push("Meta")

  // Handle special keys
  const key = shortcut.key
  if (key.length === 1) {
    parts.push(key.toUpperCase())
  } else {
    // For keys like F1, Escape, etc.
    parts.push(key)
  }

  return parts.join(isMac ? "" : "+")
}
