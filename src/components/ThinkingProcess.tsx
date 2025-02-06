import { useState } from 'react';
import LoadingDots from './LoadingDots';

interface ThinkingProcessProps {
  content: string;
  isLoading: boolean;
}

export function ThinkingProcess({ content, isLoading }: ThinkingProcessProps) {
  return (
    <div className="text-sm text-zinc-400 italic">
      <div className="flex items-center gap-2">
        <span>{content}</span>
        {isLoading && (
          <div className="flex items-center gap-1">
            <div className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1 h-1 rounded-full bg-zinc-400 animate-bounce" />
          </div>
        )}
      </div>
    </div>
  );
}
