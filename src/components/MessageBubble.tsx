import ReactMarkdown from 'react-markdown';
import { Message } from "@/types";
import { ThinkingProcess } from "@/components/ThinkingProcess";
import { useState, useEffect } from 'react';
import { LoaderDots } from './LoaderDots';
import { Spinner } from './Spinner';
import CodeBlock from './CodeBlock';
import { InlineMath, BlockMath } from 'react-katex';
import { RefreshCw } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  isThinking: boolean;
  isLatest: boolean;
  hideThinking: boolean;
  onResend?: () => void;
  showResend?: boolean;
}

export function MessageBubble({ 
  message, 
  isThinking, 
  isLatest, 
  hideThinking,
  onResend,
  showResend 
}: MessageBubbleProps) {
  const [isThinkingOpen, setIsThinkingOpen] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        // Use a global thinking state instead of per-message
        const savedGlobalState = localStorage.getItem('thinking-state-global');
        // Default to true if not set
        return savedGlobalState === null ? true : JSON.parse(savedGlobalState);
      }
      return true;
    } catch {
      return true;
    }
  });

  // Save thinking state globally when changed
  useEffect(() => {
    try {
      localStorage.setItem('thinking-state-global', JSON.stringify(isThinkingOpen));
    } catch (error) {
      console.warn('Failed to save thinking state:', error);
    }
  }, [isThinkingOpen]);

  const messageContent = getMessageContent(message.text);
  // Update how we determine if there's thinking content
  const hasThinking = Boolean(messageContent.thinking || message.thinking);

  if (message.isUser) {
    return (
      <div className="flex justify-end mb-6 group items-start">
        {showResend && (
          <button
            onClick={onResend}
            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-zinc-800 rounded-lg transition-all duration-200 flex-shrink-0"
            title="Resend message"
          >
            <RefreshCw className="w-4 h-4 text-zinc-400" />
          </button>
        )}
        <p className="bg-zinc-800 text-zinc-100 px-4 py-3 rounded-xl max-w-[85%] sm:max-w-[75%] whitespace-pre-wrap ml-2">
          {message.text}
        </p>
      </div>
    );
  }

  // Special case for initial message
  if (message.text === "What's on your mind?") {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <p className="text-2xl font-light text-zinc-400">
          {message.text}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Only show spinner when actively thinking and no response yet */}
      {isThinking && isLatest && hideThinking && !messageContent.response && (
        <div className="max-w-[85%] sm:max-w-[75%] flex items-center gap-2">
          <Spinner />
          <span className="text-xs font-medium text-zinc-400">Thinking...</span>
        </div>
      )}

      {/* Show thinking process when not hidden and has content */}
      {(!hideThinking && hasThinking) && (
        <div className="max-w-[85%] sm:max-w-[75%]">
          <button
            onClick={() => setIsThinkingOpen(!isThinkingOpen)}
            className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-300 transition-colors mb-2"
          >
            <div className="flex items-center gap-2">
              {isThinking && isLatest && <Spinner />}
              <span className="font-medium">Thinking Process</span>
            </div>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                isThinkingOpen ? 'rotate-90' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          {isThinkingOpen && (messageContent.thinking || message.thinking) && (
            <div className="bg-zinc-800/50 border border-zinc-700/50 px-4 py-3 rounded-2xl animate-in slide-in-from-top-2">
              <ReactMarkdown
                className="prose dark:prose-invert prose-sm max-w-none text-zinc-400 italic"
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    if (!inline && match) {
                      return (
                        <CodeBlock
                          language={match[1]}
                          value={String(children).trim()}
                        />
                      );
                    }
                    return (
                      <code className="bg-zinc-900/50 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                        {children}
                      </code>
                    );
                  },
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0">{children}</p>
                  )
                }}
              >
                {messageContent.thinking || message.thinking}
              </ReactMarkdown>
            </div>
          )}
        </div>
      )}

      {messageContent.response && (
        <div className="max-w-[85%] sm:max-w-[75%]">
          <ReactMarkdown
            className="prose dark:prose-invert prose-sm max-w-none text-zinc-100"
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                if (!inline && match) {
                  return (
                    <CodeBlock
                      language={match[1]}
                      value={String(children).trim()}
                    />
                  );
                }
                return (
                  <code className="bg-zinc-900/50 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                    {children}
                  </code>
                );
              },
              // Add math rendering
              p: ({children}) => {
                if (typeof children === 'string') {
                  // Handle inline math
                  const parts = children.split(/(\$.*?\$)/g);
                  return (
                    <p className="mb-4 last:mb-0">
                      {parts.map((part, i) => {
                        if (part.startsWith('$') && part.endsWith('$')) {
                          const math = part.slice(1, -1);
                          return <InlineMath key={i}>{math}</InlineMath>;
                        }
                        return part;
                      })}
                    </p>
                  );
                }
                return <p className="mb-4 last:mb-0">{children}</p>;
              },
              // Handle block math
              blockquote: ({children}) => {
                if (typeof children === 'string' && children.startsWith('$$') && children.endsWith('$$')) {
                  const math = children.slice(2, -2);
                  return <BlockMath>{math}</BlockMath>;
                }
                return <blockquote>{children}</blockquote>;
              }
            }}
          >
            {messageContent.response}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

const getMessageContent = (text: string) => {
  const thinkMatch = text.match(/<think>(.*?)<\/think>/s);
  const thinkContent = thinkMatch ? thinkMatch[1].trim() : "";
  const responseContent = text.replace(/<think>.*?<\/think>/s, '').trim();

  return {
    thinking: thinkContent,
    response: responseContent
  };
};
