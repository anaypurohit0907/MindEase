import ReactMarkdown from 'react-markdown';
import { Message } from "@/types";
import { useState, useEffect } from 'react';
import { Spinner } from './Spinner';
import { RefreshCw } from 'lucide-react';
import CodeBlock from './CodeBlock';
import { InlineMath, BlockMath } from 'react-katex';
import type { Components } from 'react-markdown';

interface MessageBubbleProps {
  message: Message;
  isThinking: boolean;
  isLatest: boolean;
  hideThinking: boolean;
  onResend?: () => void;
  showResend?: boolean;
}

export function MessageBubble({ message, isThinking, isLatest, hideThinking, onResend, showResend }: MessageBubbleProps) {
  const [isThinkingOpen, setIsThinkingOpen] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedGlobalState = localStorage.getItem('thinking-state-global');
        return savedGlobalState === null ? true : JSON.parse(savedGlobalState);
      }
      return true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('thinking-state-global', JSON.stringify(isThinkingOpen));
    } catch (error) {
      console.warn('Failed to save thinking state:', error);
    }
  }, [isThinkingOpen]);

  const safeText = message?.text || '';
  const messageContent = getMessageContent(safeText);
  const hasThinking = Boolean(messageContent.thinking || message.thinking);

  const markdownComponents: Components = {
    code(props) {
      const { className, children, ...rest } = props;
      const match = /language-(\w+)/.exec(className || '');
      if (match) {
        return (
          <CodeBlock
            language={match[1]}
            value={String(children).trim()}
          />
        );
      }
      return (
        <code className="bg-zinc-900/50 px-1.5 py-0.5 rounded text-sm font-mono" {...rest}>
          {children}
        </code>
      );
    },
    p(props) {
      const { children } = props;
      if (typeof children === 'string') {
        // Safely handle text content
        const text = children?.trim() || '';
        
        // Skip empty paragraphs
        if (!text) return null;

        try {
          const parts = text.split(/(\$.*?\$)/g);
          return (
            <p className="mb-4 last:mb-0">
              {parts.map((part, i) => {
                if (part?.startsWith('$') && part?.endsWith('$')) {
                  const math = part.slice(1, -1).trim();
                  return math ? <InlineMath key={i}>{math}</InlineMath> : null;
                }
                return part || null;
              }).filter(Boolean)}
            </p>
          );
        } catch (error) {
          console.warn('Error processing markdown:', error);
          return <p className="mb-4 last:mb-0">{text}</p>;
        }
      }
      return <p className="mb-4 last:mb-0">{children}</p>;
    },
    blockquote(props) {
      const { children } = props;
      if (typeof children === 'string' && children.startsWith('$$') && children.endsWith('$$')) {
        const math = children.slice(2, -2);
        return <BlockMath>{math}</BlockMath>;
      }
      return <blockquote>{children}</blockquote>;
    }
  };

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
                components={markdownComponents}
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
            components={markdownComponents}
          >
            {messageContent.response}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

const getMessageContent = (text: string) => {
  if (!text || typeof text !== 'string') {
    return {
      thinking: '',
      response: ''
    };
  }

  try {
    let responseContent = text;
    let thinkContent = '';

    // Only attempt to process think blocks if they exist
    if (text.includes('<think>')) {
      const thinkMatch = text.match(/<think>(.*?)<\/think>/s);
      thinkContent = thinkMatch?.[1]?.trim() || '';
      responseContent = text.replace(/<think>.*?<\/think>/gs, '').trim();
    }

    return {
      thinking: thinkContent,
      response: responseContent || text // Fallback to original text if empty
    };
  } catch (error) {
    console.warn('Error parsing message content:', error);
    return {
      thinking: '',
      response: text // Return original text on error
    };
  }
};
