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

interface ApiModelConfig {
  url: string;
  headers: (_: string) => Record<string, string>;
  transformRequest: (message: string, context: string) => ApiRequestBody;
  transformResponse: (response: ApiResponseData) => string;
  streamRequest?: boolean;
}

const API_CONFIGS: Record<string, ApiModelConfig> = {
  'gemini-api': {
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=',
    headers: () => ({
      'Content-Type': 'application/json',
    }),
    transformRequest: (message: string, context: string): ApiRequestBody => {
      // Convert conversation history into proper Gemini format
      const contents = [];
      
      // Add context messages if they exist
      if (context) {
        const contextMessages = context.split('\n\n');
        for (const msg of contextMessages) {
          const [role, text] = msg.split(': ').map(s => s.trim());
          if (role && text) {
            contents.push({
              parts: [{ text }],
              role: role.toLowerCase() === 'user' ? 'user' : 'model'
            });
          }
        }
      }

      // Add the current message
      contents.push({
        parts: [{ text: message }],
        role: 'user'
      });

      console.log('Gemini request:', { contents }); // Debug log
      return { contents };
    },
    transformResponse: (response: ApiResponseData): string => {
      try {
        console.log('Raw Gemini response:', JSON.stringify(response, null, 2));
        
        // Handle potential error responses
        if (response?.error) {
          throw new Error(response.error.message || 'Unknown API error');
        }

        if (!response?.candidates?.[0]?.content?.parts?.[0]?.text) {
          throw new Error('Invalid response format from Gemini API');
        }

        const text = response.candidates[0].content.parts[0].text;
        return text.trim();
      } catch (error) {
        console.error('Error parsing Gemini response:', error);
        throw error; // Re-throw to handle in the route
      }
    },
    streamRequest: false
  }
};

export const getApiModelConfig = (model: string): ApiModelConfig | null => {
  return API_CONFIGS[model] || null;
};
