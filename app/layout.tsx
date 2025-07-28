import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ToastProvider } from "@/app/hooks/useToast"
import ToastContainer from "@/app/components/ToastContainer"
import ErrorBoundary from "@/app/components/ErrorBoundary"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Ollama UI",
  description:
    "Ollama UI is a web interface for Ollama, a tool for running large language models locally.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <ToastProvider>
            {children}
            <ToastContainer />
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
