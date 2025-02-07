import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

async function checkOllamaConnection() {
  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.ok;
  } catch {
    // Error parameter removed since it's not used
    return false;
  }
}

export async function POST(req: Request) {
  const encoder = new TextEncoder();
  const { signal } = req;

  try {
    // Check Ollama connection first
    const isOllamaRunning = await checkOllamaConnection();
    if (!isOllamaRunning) {
      return NextResponse.json(
        { error: 'Ollama server is not running. Please start Ollama and try again.' },
        { status: 503 }
      );
    }

    const { message, context, model } = await req.json();

    // Start the stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: model || "deepseek-r1:1.5b",
              prompt: `${context}\n\nHuman: ${message}\n\nAssistant:`,
              stream: true,
              options: {
                temperature: 0.7,
                num_ctx: 4096,
              }
            }),
            signal,
          });

          if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
          }

          const reader = response.body?.getReader();
          if (!reader) throw new Error('No reader available');

          let responseText = "";
          let thinkingText = "";
          let isInThinkBlock = false;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n').filter(Boolean);

            for (const line of lines) {
              const { response } = JSON.parse(line);
              
              // Check for thinking block markers
              if (response.includes('<think>') && !isInThinkBlock) {
                isInThinkBlock = true;
                thinkingText = '';
                continue;
              }

              if (isInThinkBlock) {
                if (response.includes('</think>')) {
                  isInThinkBlock = false;
                  // Remove </think> tag from thinking text
                  thinkingText += response.split('</think>')[0];
                  // Add any remaining text to responseText
                  responseText += response.split('</think>')[1] || '';
                } else {
                  thinkingText += response;
                }
              } else {
                responseText += response;
              }

              // Send update with current state
              controller.enqueue(encoder.encode(
                JSON.stringify({
                  thinking: thinkingText || "Processing...",
                  response: responseText,
                  done: false
                }) + '\n'
              ));
            }
          }

          // Send final message
          controller.enqueue(encoder.encode(
            JSON.stringify({
              thinking: thinkingText,
              response: responseText,
              done: true
            }) + '\n'
          ));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          controller.enqueue(encoder.encode(
            JSON.stringify({
              error: errorMessage,
              done: true
            }) + '\n'
          ));
          controller.close();
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process request',
        details: 'Please ensure Ollama is running on http://localhost:11434'
      },
      { status: 500 }
    );
  }
}
