"use client"

import { useToast } from "@/app/hooks/useToast"
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid"

export default function ToastContainer() {
  const { toasts, removeToast } = useToast()

  const getIcon = (type: string) => {
    switch (type) {
      case "error":
        return <ExclamationCircleIcon className="w-5 h-5" />
      case "warning":
        return <ExclamationTriangleIcon className="w-5 h-5" />
      case "success":
        return <CheckCircleIcon className="w-5 h-5" />
      case "info":
        return <InformationCircleIcon className="w-5 h-5" />
      default:
        return <InformationCircleIcon className="w-5 h-5" />
    }
  }

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
          {getIcon(toast.type)}
          <p className="flex-1">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  )
}
