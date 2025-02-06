import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings2, SendHorizontal } from "lucide-react";
import { useState, useRef, useEffect } from 'react';
import ModelSelector from './ModelSelector';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
  onHideThinkingChange
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '45px'; // Reduced from 60px
      const scrollHeight = textareaRef.current.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, 45), 200); // Changed min height
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="absolute inset-x-6 bottom-6">
      <div className="relative max-w-3xl mx-auto rounded-xl bg-zinc-800/80 backdrop-blur-xl shadow-[0_0_15px_rgba(0,0,0,0.3)] border border-zinc-700/50">
        <div className="min-h-[45px] w-full"> {/* Reduced from 60px */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            className="w-full resize-none rounded-t-xl bg-transparent px-4 pt-2.5 pb-2 text-sm focus:outline-none focus:ring-0 scrollbar-thin" // Adjusted padding
            style={{
              height: '30px',
              minHeight: '30px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}
          />
        </div>

        <div className="flex items-center justify-between py-2 px-3 border-t border-zinc-700/50"> {/* Reduced padding */}
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
                Hide thinking
              </Label>
            </div>
          </div>
          <Button
            onClick={isLoading ? onStopGeneration : onSubmit}
            disabled={!input.trim() && !isLoading}
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
          >
            {isLoading ? (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M6 19h12V5H6v14zm5-8h2V9h-2v2z" />
              </svg>
            ) : (
              <SendHorizontal className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
