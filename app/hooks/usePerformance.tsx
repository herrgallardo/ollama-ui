"use client"

import { useRef, useEffect } from "react"

/**
 * Hook to track component render performance in development
 * Shows how many times a component renders and how long each render takes
 */
export function useRenderPerformance(
  componentName: string,
  enabled = process.env.NODE_ENV === "development"
) {
  const renderCount = useRef(0)
  const lastRenderTime = useRef(Date.now())

  useEffect(() => {
    if (!enabled) return

    renderCount.current += 1
    const now = Date.now()
    const timeSinceLastRender = now - lastRenderTime.current

    if (renderCount.current > 1) {
      console.debug(
        `🔄 ${componentName} render #${renderCount.current} (${timeSinceLastRender}ms since last render)`
      )
    } else {
      console.debug(`🚀 ${componentName} initial render`)
    }

    lastRenderTime.current = now
  })
}

/**
 * Hook to measure and log expensive operations
 */
export function usePerformanceTimer(
  operationName: string,
  enabled = process.env.NODE_ENV === "development"
) {
  const startTimer = () => {
    if (!enabled) return () => {}

    const startTime = performance.now()

    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime

      if (duration > 16) {
        // Log if operation takes longer than one frame (16ms)
        console.warn(
          `⚠️ Slow operation: ${operationName} took ${duration.toFixed(2)}ms`
        )
      } else {
        console.debug(
          `✅ ${operationName} completed in ${duration.toFixed(2)}ms`
        )
      }
    }
  }

  return { startTimer }
}

/**
 * Hook to detect memory leaks by tracking component mount/unmount
 */
export function useMemoryLeak(
  componentName: string,
  enabled = process.env.NODE_ENV === "development"
) {
  const mountTime = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!enabled) return

    mountTime.current = Date.now()
    console.debug(`📍 ${componentName} mounted`)

    return () => {
      const unmountTime = Date.now()
      const lifespan = mountTime.current ? unmountTime - mountTime.current : 0
      console.debug(`📤 ${componentName} unmounted after ${lifespan}ms`)
    }
  }, [componentName, enabled])
}

/**
 * Hook to debounce expensive operations
 */
export function useDebounce<T extends (...args: never[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedCallback = ((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }) as T

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

/**
 * Hook to throttle expensive operations
 */
export function useThrottle<T extends (...args: never[]) => void>(
  callback: T,
  delay: number
): T {
  const lastCallTime = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const throttledCallback = ((...args: Parameters<T>) => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCallTime.current

    if (timeSinceLastCall >= delay) {
      lastCallTime.current = now
      callback(...args)
    } else {
      // Clear existing timeout and set a new one
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        lastCallTime.current = Date.now()
        callback(...args)
      }, delay - timeSinceLastCall)
    }
  }) as T

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return throttledCallback
}

/**
 * Hook to measure list rendering performance
 */
export function useListPerformance<T>(
  items: T[],
  itemName: string,
  enabled = process.env.NODE_ENV === "development"
) {
  const previousLength = useRef(items.length)

  useEffect(() => {
    if (!enabled) return

    const currentLength = items.length
    const lengthDiff = currentLength - previousLength.current

    if (lengthDiff !== 0) {
      const action = lengthDiff > 0 ? "added" : "removed"
      const count = Math.abs(lengthDiff)
      console.debug(
        `📋 ${itemName} list: ${action} ${count} item${count !== 1 ? "s" : ""} (total: ${currentLength})`
      )

      if (currentLength > 1000) {
        console.warn(
          `⚠️ Large ${itemName} list detected (${currentLength} items). Consider implementing virtual scrolling.`
        )
      }
    }

    previousLength.current = currentLength
  }, [items.length, itemName, enabled])
}
