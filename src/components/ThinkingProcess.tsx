import { Spinner } from './Spinner';

interface ThinkingProcessProps {
  content?: string;
  isTyping?: boolean;
}

export function ThinkingProcess({ content, isTyping }: ThinkingProcessProps) {
  return (
    <div>
      {isTyping && (
        <div className="flex items-center space-x-2">
          <Spinner />
          <span className="text-sm text-zinc-400">Thinking...</span>
        </div>
      )}
      {content && (
        <div className="mt-2 text-sm text-zinc-400">
          {content}
        </div>
      )}
    </div>
  );
}
