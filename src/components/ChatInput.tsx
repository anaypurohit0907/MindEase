import { Button } from "@/components/ui/button";
import { SendHorizontal, Loader2, Square } from "lucide-react";
import { useRef, useEffect } from 'react';
import ModelSelector from './ModelSelector';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (message?: string) => void;
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
  onHideThinkingChange
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '45px';
      const scrollHeight = textareaRef.current.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, 45), 200);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoading) {
      onStopGeneration();
    } else {
      onSubmit();
    }
  };

  return (
    <div className="absolute inset-x-6 bottom-6">
      <div className="relative max-w-3xl mx-auto rounded-xl bg-zinc-800/80 backdrop-blur-xl shadow-[0_0_15px_rgba(0,0,0,0.3)] border border-zinc-700/50">
        <div className="min-h-[45px] w-full">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            className="w-full resize-none rounded-t-xl bg-transparent px-4 pt-2.5 pb-2 text-sm focus:outline-none focus:ring-0 scrollbar-thin"
            style={{
              height: '30px',
              minHeight: '30px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}
          />
        </div>

        <div className="flex items-center justify-between py-2 px-3 border-t border-zinc-700/50">
          <div className="flex items-center gap-4">
            <ModelSelector
              currentModel={selectedModel}
              onModelChange={onModelChange}
            />
            <div className="flex items-center space-x-2 border-l border-zinc-700/50 pl-4">
              <Checkbox
                id="hide-thinking"
                checked={hideThinking}
                onCheckedChange={(checked) => onHideThinkingChange(checked as boolean)}
                className="h-4 w-4 border-zinc-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <Label
                htmlFor="hide-thinking"
                className="text-xs font-medium text-zinc-400 select-none"
              >
                Hide thinking (For Reasoning Models)
              </Label>
            </div>
          </div>
          <div className="flex gap-2">
            {isLoading && (
              <Button
                onClick={onStopGeneration}
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg bg-red-600 hover:bg-red-500 text-white"
                title="Stop generation"
              >
                <Square className="h-4 w-4" />
              </Button>
            )}
            <Button
              onClick={handleButtonClick}
              disabled={!input.trim() && !isLoading}
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
