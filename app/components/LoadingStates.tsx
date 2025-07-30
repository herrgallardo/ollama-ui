"use client"

import { memo } from "react"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  color?: "blue" | "green" | "gray" | "white"
  className?: string
}

export const LoadingSpinner = memo(function LoadingSpinner({
  size = "md",
  color = "blue",
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  }

  const colorClasses = {
    blue: "text-blue-500",
    green: "text-green-500",
    gray: "text-gray-500",
    white: "text-white",
  }

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
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
  )
})

interface TypingIndicatorProps {
  className?: string
}

export const TypingIndicator = memo(function TypingIndicator({
  className = "",
}: TypingIndicatorProps) {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className="flex space-x-1">
        <div
          className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <div
          className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <div
          className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
        AI is thinking...
      </span>
    </div>
  )
})

interface SkeletonProps {
  className?: string
  lines?: number
  animated?: boolean
}

export const Skeleton = memo(function Skeleton({
  className = "",
  lines = 1,
  animated = true,
}: SkeletonProps) {
  const baseClasses = `bg-gray-200 dark:bg-gray-700 rounded ${animated ? "animate-shimmer" : ""}`

  if (lines === 1) {
    return <div className={`${baseClasses} h-4 ${className}`} />
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className={`${baseClasses} h-4`}
          style={{
            width: i === lines - 1 ? "75%" : "100%", // Last line is shorter
          }}
        />
      ))}
    </div>
  )
})

interface MessageSkeletonProps {
  isUser?: boolean
  className?: string
}

export const MessageSkeleton = memo(function MessageSkeleton({
  isUser = false,
  className = "",
}: MessageSkeletonProps) {
  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4 ${className}`}
    >
      <div
        className={`max-w-[80%] rounded-lg p-4 ${
          isUser
            ? "bg-blue-100 dark:bg-blue-900/20"
            : "bg-gray-100 dark:bg-gray-800"
        }`}
      >
        <div className="flex items-center mb-2">
          <Skeleton className="w-16 h-3" />
        </div>
        <Skeleton lines={2} />
      </div>
    </div>
  )
})

interface ConnectionStatusProps {
  isConnected: boolean
  isConnecting?: boolean
  className?: string
}

export const ConnectionStatus = memo(function ConnectionStatus({
  isConnected,
  isConnecting = false,
  className = "",
}: ConnectionStatusProps) {
  if (isConnecting) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <LoadingSpinner size="sm" color="blue" />
        <span className="text-sm text-blue-600 dark:text-blue-400">
          Connecting to Ollama...
        </span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`w-2 h-2 rounded-full transition-colors ${
          isConnected ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <span
        className={`text-sm transition-colors ${
          isConnected
            ? "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400"
        }`}
      >
        {isConnected ? "Connected to Ollama" : "Ollama not connected"}
      </span>
    </div>
  )
})

interface ProgressBarProps {
  progress: number // 0-100
  className?: string
  showPercentage?: boolean
  color?: "blue" | "green" | "yellow" | "red"
}

export const ProgressBar = memo(function ProgressBar({
  progress,
  className = "",
  showPercentage = false,
  color = "blue",
}: ProgressBarProps) {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500",
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1">
        {showPercentage && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {Math.round(progress)}%
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ease-out ${colorClasses[color]}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  )
})

interface PulsingDotProps {
  color?: "blue" | "green" | "red" | "yellow"
  size?: "sm" | "md" | "lg"
  className?: string
}

export const PulsingDot = memo(function PulsingDot({
  color = "blue",
  size = "md",
  className = "",
}: PulsingDotProps) {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    red: "bg-red-500",
    yellow: "bg-yellow-500",
  }

  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  }

  return (
    <div
      className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-pulse ${className}`}
    />
  )
})

interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
  progress?: number
  onCancel?: () => void
  className?: string
}

export const LoadingOverlay = memo(function LoadingOverlay({
  isVisible,
  message = "Loading...",
  progress,
  onCancel,
  className = "",
}: LoadingOverlayProps) {
  if (!isVisible) return null

  return (
    <div
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-900 dark:text-gray-100 mb-4">{message}</p>

          {progress !== undefined && (
            <ProgressBar progress={progress} showPercentage className="mb-4" />
          )}

          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
})
