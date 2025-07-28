"use client"

import { useToast } from "@/app/hooks/useToast"

export default function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
            transform transition-all duration-300 ease-in-out
            animate-slide-in-right
            ${
              toast.type === "error"
                ? "bg-red-500 text-white"
                : toast.type === "warning"
                  ? "bg-yellow-500 text-white"
                  : toast.type === "success"
                    ? "bg-green-500 text-white"
                    : "bg-blue-500 text-white"
            }
          `}
        >
          <span className="text-lg">
            {toast.type === "error" && "❌"}
            {toast.type === "warning" && "⚠️"}
            {toast.type === "success" && "✅"}
            {toast.type === "info" && "ℹ️"}
          </span>
          <p className="flex-1">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-white/80 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
