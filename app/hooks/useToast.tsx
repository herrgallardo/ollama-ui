"use client"

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useRef,
  useEffect,
} from "react"

export interface Toast {
  id: string
  message: string
  type: "success" | "error" | "warning" | "info"
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, "id">) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))

    // Clear any existing timeout for this toast
    const timeout = timeoutsRef.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      timeoutsRef.current.delete(id)
    }
  }, [])

  const addToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = Date.now().toString()
      const newToast = { ...toast, id }

      setToasts((prev) => [...prev, newToast])

      // Auto-remove after duration (default 5 seconds)
      const duration = toast.duration || 5000
      const timeout = setTimeout(() => {
        removeToast(id)
      }, duration)

      timeoutsRef.current.set(id, timeout)
    },
    [removeToast]
  )

  // Cleanup timeouts on unmount
  useEffect(() => {
    // Capture the current value of the ref
    const timeouts = timeoutsRef.current

    return () => {
      // Use the captured value in the cleanup function
      timeouts.forEach((timeout) => clearTimeout(timeout))
      timeouts.clear()
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
