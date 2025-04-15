// API model configurations for different LLM providers
interface ApiRequestBody {
  contents: Array<{
    parts: Array<{ text: string }>;
    role?: string;
  }>;
}

interface ApiResponseData {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
}

export interface ApiModelConfig {
  url: string;
  headers: (_: string) => Record<string, string>;
  transformRequest: (message: string, context: string) => ApiRequestBody;
  transformResponse: (response: ApiResponseData) => string;
  streamRequest?: boolean;
}

// Define available API models
export const API_MODELS: Record<string, ApiModelConfig> = {
  "gemini-api": {
    // Updated URL for Gemini 2.0 Flash API
    url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=",
    headers: () => ({
      "Content-Type": "application/json",
    }),
    transformRequest: (message: string, context: string): ApiRequestBody => {
      const contents = [];

      // Add context messages if they exist
      if (context) {
        const contextMessages = context.split("\n\n");
        for (const msg of contextMessages) {
          const [role, text] = msg.split(": ");
          if (role && text) {
            contents.push({
              parts: [{ text: text.trim() }],
              role: role.toLowerCase() === "user" ? "user" : "model",
            });
          }
        }
      }

      // Add the current message
      contents.push({
        parts: [{ text: message }],
        role: "user",
      });

      return { contents };
    },
    transformResponse: (response: ApiResponseData): string => {
      if (response?.error) {
        throw new Error(response.error.message || "Unknown API error");
      }

      if (!response?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("Invalid response format from Gemini API");
      }

      return response.candidates[0].content.parts[0].text.trim();
    },
  },
};

// Helper function to get model config
export function getApiModelConfig(modelName: string): ApiModelConfig | null {
  return API_MODELS[modelName] || null;
}
