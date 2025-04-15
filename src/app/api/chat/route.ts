import { getApiModelConfig } from "@/lib/apiModels";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const encoder = new TextEncoder();

  try {
    const { message, context, model, apiKey } = await req.json();

    // Default to Gemini API if no specific model is provided
    const actualModel = model || "gemini-api";

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
          throw new Error(data.error?.message || response.statusText);
        }

        const fullText = config.transformResponse(data);
        if (!fullText) throw new Error("Empty response from API");

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
        throw new Error(
          error instanceof Error ? error.message : "Unknown API error"
        );
      }
    } else {
      // Return error if trying to use non-API models since we're removing Ollama support
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
  }
}
