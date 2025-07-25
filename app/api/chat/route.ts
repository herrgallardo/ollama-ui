import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const {
      messages,
      model = "llama3.1:8b",
      systemPrompt,
    } = await request.json()

    // Add system prompt if provided
    const allMessages = systemPrompt
      ? [{ role: "system", content: systemPrompt }, ...messages]
      : messages

    const response = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: allMessages,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`)
    }

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        try {
          while (true) {
            const { done, value } = await reader!.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split("\n").filter((line) => line.trim())

            for (const line of lines) {
              try {
                const data = JSON.parse(line)
                if (data.message?.content) {
                  controller.enqueue(
                    new TextEncoder().encode(data.message.content)
                  )
                }
              } catch {
                // Skip invalid JSON lines
              }
            }
          }
        } catch (error) {
          controller.error(error)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Error:", error)
    return Response.json(
      { error: "Failed to communicate with Ollama" },
      { status: 500 }
    )
  }
}
