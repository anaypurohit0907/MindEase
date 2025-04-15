import { Send, Settings, StopCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onStopGeneration: () => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  hideThinking: boolean;
  onHideThinkingChange: (value: boolean) => void;
}

export function ChatInput({
  input,
  isLoading,
  onInputChange,
  onSubmit,
  onStopGeneration,
  selectedModel,
  onModelChange,
  hideThinking,
  onHideThinkingChange,
}: ChatInputProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  useEffect(() => {
    const savedGeminiApiKey = localStorage.getItem("geminiApiKey") || "";
    setGeminiApiKey(savedGeminiApiKey);
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem("geminiApiKey", geminiApiKey);
    setShowSettings(false);
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "48px";
      inputRef.current.style.height = `${Math.min(
        inputRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [input]);

  // Close settings modal if Escape key is pressed
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showSettings) {
        setShowSettings(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [showSettings]);

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="relative bg-zinc-800/80 backdrop-blur border border-zinc-700 rounded-xl mb-8 mx-4 max-w-3xl"
      >
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          className="min-h-[48px] max-h-[200px] w-full pl-4 pr-24 py-3 bg-transparent text-white focus:outline-none resize-none"
          style={{ overflowY: input ? "auto" : "hidden" }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !isLoading) {
              e.preventDefault();
              if (input.trim()) onSubmit();
            }
          }}
        />
        <div className="absolute right-2 bottom-2 flex items-center gap-2">
          <button
            type="button"
            className="text-zinc-400 hover:text-white focus:outline-none"
            onClick={() => setShowSettings(true)}
          >
            <Settings size={18} />
          </button>
          {!isLoading ? (
            <button
              type="submit"
              className="bg-blue-600 text-white p-1.5 rounded-md hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:pointer-events-none"
              disabled={!input.trim()}
            >
              <Send size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onStopGeneration}
              className="bg-red-600 text-white p-1.5 rounded-md hover:bg-red-700 focus:outline-none"
            >
              <StopCircle size={16} />
            </button>
          )}
        </div>
      </form>

      {/* Simple modal dialog without external library */}
      {showSettings && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-70 flex items-center justify-center p-4">
          <div className="relative bg-zinc-800 rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-white">
                Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => onModelChange(e.target.value)}
                className="bg-zinc-700 border border-zinc-600 text-white text-sm rounded-lg block w-full p-2.5 focus:border-blue-500"
              >
                <option value="gemini-api">Gemini Pro</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-white">
                Gemini API Key
              </label>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
                className="bg-zinc-700 border border-zinc-600 text-white text-sm rounded-lg block w-full p-2.5 focus:border-blue-500"
              />
              <p className="mt-2 text-xs text-zinc-400">
                This will override the key in your .env file. Leave empty to use
                the key from your environment.
              </p>
            </div>

            <div className="flex items-center mb-6">
              <input
                type="checkbox"
                id="hideThinking"
                checked={hideThinking}
                onChange={(e) => onHideThinkingChange(e.target.checked)}
                className="w-4 h-4 bg-zinc-700 border-zinc-600 rounded focus:ring-blue-600"
              />
              <label
                htmlFor="hideThinking"
                className="ml-2 text-sm font-medium text-white"
              >
                Hide thinking process
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-zinc-700 rounded-md hover:bg-zinc-600 focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
