import { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { CSSProperties } from 'react';

interface CodeBlockProps {
  language: string;
  value: string;
  output?: string;
}

export default function CodeBlock({ language, value, output }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Fix style type issues
  const customStyle: { [key: string]: CSSProperties } = {
    'pre[class*="language-"]': {
      background: 'transparent',
      margin: 0,
      padding: '1rem',
      whiteSpace: 'pre',
      tabSize: 4,
      overflowX: 'auto' as const, // Type assertion for overflow
      MozTabSize: 4,
    },
    'code[class*="language-"]': {
      fontSize: '0.875rem',
      lineHeight: 1.7,
      fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
      whiteSpace: 'pre',
      tabSize: 4,
      MozTabSize: 4,
    }
  };

  const style = {
    ...oneDark,
    ...customStyle
  };

  return (
    <div className="relative mt-2 mb-3 rounded-xl overflow-hidden bg-zinc-800/30 border border-zinc-700/50 shadow-sm">
      <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-900/50 border-b border-zinc-700/50">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-medium text-zinc-400">{language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-400 hover:text-zinc-300 hover:bg-zinc-700/50 rounded transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-2 bg-transparent overflow-x-auto">
        <SyntaxHighlighter
          language={language.toLowerCase()}
          style={style}
          customStyle={{
            fontSize: '14px',
            lineHeight: 1.7,
            margin: 0,
            padding: 0,
            background: 'transparent',
            whiteSpace: 'pre',
            tabSize: 4,
          }}
          showLineNumbers
          wrapLongLines={false}
        >
          {value}
        </SyntaxHighlighter>
      </div>
      {output && (
        <div className="border-t border-zinc-700/50">
          <div className="px-4 py-3 bg-zinc-900/30">
            <div className="text-xs font-medium text-zinc-400 mb-2">Output:</div>
            <pre className="text-sm text-zinc-300 font-mono whitespace-pre-wrap">{output}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
