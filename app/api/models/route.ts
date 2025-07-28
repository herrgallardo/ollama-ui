import { NextResponse } from "next/server"
import { OLLAMA_API_BASE } from "@/app/constants/prompts"

export async function GET() {
  try {
    const response = await fetch(`${OLLAMA_API_BASE}/api/tags`)
    const data = await response.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ models: [] }, { status: 500 })
  }
}
