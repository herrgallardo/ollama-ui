import { NextRequest } from "next/server"

interface StreamResponse {
  content: string
  stats?: {
    eval_count?: number
    eval_duration?: number
    prompt_eval_count?: number
    prompt_eval_duration?: number
    total_duration?: number
  }
}

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
        let stats = {}

        try {
          while (true) {
            const { done, value } = await reader!.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split("\n").filter((line) => line.trim())

            for (const line of lines) {
              try {
                const data = JSON.parse(line)

                // Stream content chunks
                if (data.message?.content) {
                  // Send content chunk
                  const responseChunk: StreamResponse = {
                    content: data.message.content,
                  }
                  controller.enqueue(
                    new TextEncoder().encode(
                      JSON.stringify(responseChunk) + "\n"
                    )
                  )
                }

                // Capture final statistics
                if (data.done && data.done === true) {
                  stats = {
                    eval_count: data.eval_count,
                    eval_duration: data.eval_duration,
                    prompt_eval_count: data.prompt_eval_count,
                    prompt_eval_duration: data.prompt_eval_duration,
                    total_duration: data.total_duration,
                  }
                  // Send final stats
                  const statsChunk: StreamResponse = {
                    content: "",
                    stats: stats,
                  }
                  controller.enqueue(
                    new TextEncoder().encode(JSON.stringify(statsChunk) + "\n")
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
