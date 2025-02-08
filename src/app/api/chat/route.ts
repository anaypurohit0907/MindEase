import { NextResponse } from 'next/server';
import { getApiModelConfig } from '@/lib/apiModels';

export const runtime = 'nodejs';

async function checkOllamaConnection() {
  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    console.error('Ollama connection error:', error);
    return false;
  }
}

export async function POST(req: Request) {
  const encoder = new TextEncoder();
  const signal = AbortSignal.timeout(180000); // Increased to 3 minutes from 60 seconds

  try {
    const { message, context, model, apiKey } = await req.json();

    if (model.endsWith('-api')) {
      const config = getApiModelConfig(model);
      if (!config) throw new Error('Invalid API model');
      if (!apiKey) throw new Error('API key not provided');

      try {
        const requestBody = config.transformRequest(message, context);
        console.log('API request body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(`${config.url}${apiKey}`, {
          method: 'POST',
          headers: config.headers(apiKey),
          body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        
        if (!response.ok) {
          console.error('API error response:', data);
          throw new Error(data.error?.message || response.statusText);
        }

        const fullText = config.transformResponse(data);
        if (!fullText) throw new Error('Empty response from API');

        // Stream response back in chunks
        return new Response(
          new ReadableStream({
            async start(controller) {
              try {
                const words = fullText.split(' ');
                let currentText = '';

                for (let i = 0; i < words.length; i++) {
                  currentText += words[i] + ' ';
                  controller.enqueue(encoder.encode(
                    JSON.stringify({
                      response: currentText.trim(),
                      done: i === words.length - 1
                    }) + '\n'
                  ));
                  await new Promise(resolve => setTimeout(resolve, 10));
                }

                controller.enqueue(encoder.encode(
                  JSON.stringify({
                    response: fullText.trim(),
                    done: true
                  }) + '\n'
                ));
              } catch (error) {
                throw error; // Let the outer catch handle it
              } finally {
                controller.close();
              }
            }
          })
        );
      } catch (error) {
        console.error('API processing error:', error);
        throw new Error(error instanceof Error ? error.message : 'Unknown API error');
      }
    }

    // Check Ollama connection before proceeding
    const isOllamaRunning = await checkOllamaConnection();
    if (!isOllamaRunning) {
      return NextResponse.json(
        { 
          error: 'Ollama is not running or not accessible',
          details: 'Please make sure Ollama is running on http://localhost:11434. You can start it by running the Ollama application.'
        },
        { status: 503 }
      );
    }

    // Handle Ollama models
    const stream = new ReadableStream({
      async start(controller) {
        let responseText = "";
        let currentThinkingText = "";
        let completeThinkingText = "";
        let isInThinkBlock = false;
        let lastUpdateTime = Date.now();
        let lastActivityTime = Date.now();

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
                num_predict: 4096, // Increased token limit
              }
            }),
            signal,
          });

          if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
          }

          const reader = response.body?.getReader();
          if (!reader) throw new Error('No reader available');

          const sendUpdate = () => {
            try {
              controller.enqueue(encoder.encode(
                JSON.stringify({
                  thinking: isInThinkBlock ? currentThinkingText : completeThinkingText,
                  response: responseText,
                  done: false,
                  isThinking: isInThinkBlock
                }) + '\n'
              ));
              lastUpdateTime = Date.now();
              lastActivityTime = Date.now();
            } catch (error) {
              console.warn('Error sending update:', error);
            }
          };

          // Activity checker
          const activityChecker = setInterval(() => {
            if (Date.now() - lastActivityTime > 30000) { // 30 seconds of inactivity
              clearInterval(activityChecker);
              throw new Error('Response timeout - no activity for 30 seconds');
            }
          }, 5000);

          try {
            while (true) {
              const { done, value } = await reader.read();
              lastActivityTime = Date.now();
              
              if (done) {
                clearInterval(activityChecker);
                // Ensure final message is sent with complete text
                controller.enqueue(encoder.encode(
                  JSON.stringify({
                    thinking: completeThinkingText,
                    response: responseText,
                    done: true
                  }) + '\n'
                ));
                break;
              }

              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split('\n').filter(Boolean);

              for (const line of lines) {
                try {
                  const data = JSON.parse(line);
                  if (!data.response) continue;

                  if (data.response.includes('<think>') && !isInThinkBlock) {
                    isInThinkBlock = true;
                    currentThinkingText = '';
                    continue;
                  }

                  if (isInThinkBlock) {
                    if (data.response.includes('</think>')) {
                      isInThinkBlock = false;
                      const parts = data.response.split('</think>');
                      completeThinkingText = currentThinkingText + parts[0];
                      responseText += parts[1] || '';
                    } else {
                      currentThinkingText += data.response;
                    }
                  } else {
                    responseText += data.response;
                  }

                  // Send updates periodically to prevent buffering
                  if (Date.now() - lastUpdateTime > 50) {
                    sendUpdate();
                  }
                } catch (error) {
                  console.warn('Error processing chunk:', error);
                  continue;
                }
              }
            }
          } finally {
            clearInterval(activityChecker);
          }
        } catch (error) {
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Stream interrupted - please try again';
          
          // Send final state before closing
          controller.enqueue(encoder.encode(
            JSON.stringify({
              error: errorMessage,
              thinking: completeThinkingText || '',
              response: responseText || 'Response interrupted. You may want to try again or continue with a new message.',
              done: true
            }) + '\n'
          ));
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
        error: 'Failed to process request',
        details: error instanceof Error 
          ? error.message 
          : 'Please ensure Ollama is running on http://localhost:11434 and try again'
      },
      { status: 503 }
    );
  }
}
