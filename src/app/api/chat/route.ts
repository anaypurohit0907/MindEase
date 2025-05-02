import { getApiModelConfig } from "@/lib/apiModels";
import {
  apiRequestDuration,
  apiRequestsCounter,
  tokensProcessedCounter,
} from "@/lib/metrics";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const encoder = new TextEncoder();
  const startTime = Date.now();
  let modelUsed = "unknown";

  try {
    const { message, context, model, apiKey } = await req.json();

    // Default to Gemini API if no specific model is provided
    const actualModel = model || "gemini-api";
    modelUsed = actualModel;

    // Approximate token count (rough estimate - 4 chars per token)
    const inputTokens = Math.ceil((message?.length || 0) / 4);
    tokensProcessedCounter.inc(
      { model: modelUsed, type: "input" },
      inputTokens
    );

    // Log to verify metrics are being recorded
    console.log(`Incrementing input tokens for ${modelUsed}: ${inputTokens}`);

    // Handle API models (primarily Gemini)
    if (actualModel.endsWith("-api")) {
      const config = getApiModelConfig(actualModel);
      if (!config) throw new Error("Invalid API model");

      // Get API key from environment or request
      let effectiveApiKey = apiKey;
      if (!effectiveApiKey) {
        if (actualModel === "gemini-api") {
          effectiveApiKey = process.env.GEMINI_API_KEY;
        }
        if (!effectiveApiKey) {
          apiRequestsCounter.inc({ model: modelUsed, status: "error" });
          console.log(`Incrementing error counter for ${modelUsed}`);
          throw new Error(
            "API key not provided. Please add your API key in .env file or via the API model dialog."
          );
        }
      }

      try {
        const requestBody = config.transformRequest(message, context);
        console.log("API request body:", JSON.stringify(requestBody, null, 2));

        const response = await fetch(`${config.url}${effectiveApiKey}`, {
          method: "POST",
          headers: config.headers(effectiveApiKey),
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("API error response:", data);
          apiRequestsCounter.inc({ model: modelUsed, status: "error" });
          console.log(`Incrementing error counter for ${modelUsed}`);
          throw new Error(data.error?.message || response.statusText);
        }

        const fullText = config.transformResponse(data);
        if (!fullText) {
          apiRequestsCounter.inc({ model: modelUsed, status: "error" });
          console.log(`Incrementing error counter for ${modelUsed}`);
          throw new Error("Empty response from API");
        }

        // Track successful request
        apiRequestsCounter.inc({ model: modelUsed, status: "success" });
        console.log(`Incrementing success counter for ${modelUsed}`);

        // Estimate output tokens
        const outputTokens = Math.ceil(fullText.length / 4);
        tokensProcessedCounter.inc(
          { model: modelUsed, type: "output" },
          outputTokens
        );
        console.log(
          `Incrementing output tokens for ${modelUsed}: ${outputTokens}`
        );

        // Stream response back in chunks
        return new Response(
          new ReadableStream({
            async start(controller) {
              try {
                const words = fullText.split(" ");
                let currentText = "";

                for (let i = 0; i < words.length; i++) {
                  currentText += words[i] + " ";
                  controller.enqueue(
                    encoder.encode(
                      JSON.stringify({
                        response: currentText.trim(),
                        done: i === words.length - 1,
                      }) + "\n"
                    )
                  );
                  await new Promise((resolve) => setTimeout(resolve, 10));
                }

                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      response: fullText.trim(),
                      done: true,
                    }) + "\n"
                  )
                );
              } catch (error) {
                throw error; // Let the outer catch handle it
              } finally {
                controller.close();
              }
            },
          })
        );
      } catch (error) {
        console.error("API processing error:", error);
        apiRequestsCounter.inc({ model: modelUsed, status: "error" });
        console.log(`Incrementing error counter for ${modelUsed} on exception`);
        throw new Error(
          error instanceof Error ? error.message : "Unknown API error"
        );
      } finally {
        // Record request duration
        const duration = (Date.now() - startTime) / 1000; // convert to seconds
        apiRequestDuration.observe({ model: modelUsed }, duration);
        console.log(`Recording duration for ${modelUsed}: ${duration}s`);
      }
    } else {
      // Return error if trying to use non-API models since we're removing Ollama support
      apiRequestsCounter.inc({ model: modelUsed, status: "error" });
      console.log(`Incrementing error counter for non-API model ${modelUsed}`);
      return NextResponse.json(
        {
          error: "Only API models are supported",
          details:
            'This application has been configured to use only Gemini API models. Please select "Gemini Pro" from the model selector.',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("API error:", error);
    apiRequestsCounter.inc({ model: modelUsed, status: "error" });
    console.log(
      `Incrementing error counter for ${modelUsed} on outer exception`
    );
    return NextResponse.json(
      {
        error: "Failed to process request",
        details:
          error instanceof Error
            ? error.message
            : "Please check your API key and try again",
      },
      { status: 503 }
    );
  } finally {
    // Ensure we always record the request duration even if there's an error
    const duration = (Date.now() - startTime) / 1000;
    apiRequestDuration.observe({ model: modelUsed }, duration);
    console.log(`Final recording of duration for ${modelUsed}: ${duration}s`);
  }
}
