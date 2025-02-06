import { useState, useEffect, useRef } from 'react';

interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
  messages: Array<{
    id: string;
    text: string;
    thinking?: string;
    isUser: boolean;
    timestamp?: number;
  }>;
}

interface ChatSidebarProps {
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: string) => void;
}

export default function ChatSidebar({ currentChatId, onChatSelect, onNewChat, onDeleteChat }: ChatSidebarProps) {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [storageSize, setStorageSize] = useState<string>('0 KB');
  const loadingRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const loadChats = () => {
      // Prevent concurrent loads
      if (loadingRef.current) return;
      loadingRef.current = true;

      try {
        const storedChats = localStorage.getItem('chatSessions');
        if (!storedChats || !mounted) {
          if (mounted) setChats([]);
          return;
        }

        const parsedChats = JSON.parse(storedChats);
        const uniqueChats = Array.from(
          new Map(parsedChats.map((chat: ChatSession) => [chat.id, chat]))
        ).map(([_, chat]) => chat as ChatSession);

        const sortedChats = uniqueChats.sort((a, b) => b.timestamp - a.timestamp);

        if (mounted) {
          setChats(sortedChats);
          calculateStorageSize();
        }
      } catch (error) {
        console.error('Error loading chats:', error);
        if (mounted) setChats([]);
      } finally {
        loadingRef.current = false;
      }
    };

    const debouncedLoad = debounce(loadChats, 100);
    debouncedLoad();

    window.addEventListener('storage', debouncedLoad);
    return () => {
      mounted = false;
      window.removeEventListener('storage', debouncedLoad);
    };
  }, []);

  // Add debounce helper function
  function debounce(fn: Function, ms: number) {
    let timeoutId: NodeJS.Timeout;
    return function (...args: any[]) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(null, args), ms);
    };
  }

  const calculateStorageSize = () => {
    const allData = localStorage.getItem('chatSessions') || '';
    const bytes = new Blob([allData]).size;
    const kb = bytes / 1024;
    const mb = kb / 1024;
    setStorageSize(mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`);
  };

  const handleDelete = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    onDeleteChat(chatId);
  };

  return (
    <div className="w-64 h-screen flex flex-col border-r border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900">
      <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
        <button
          onClick={onNewChat}
          className="w-full px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg hover:opacity-90 transition-opacity"
        >
          New Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {chats.map((chat) => (
          <div
            key={`chat-${chat.id}`}
            className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer ${
              currentChatId === chat.id
                ? 'bg-gray-200 dark:bg-zinc-800'
                : 'hover:bg-gray-100 dark:hover:bg-zinc-800/50'
            }`}
            onClick={() => onChatSelect(chat.id)}
          >
            <div className="truncate flex-1">
              <p className="truncate text-sm">{chat.title || 'New Chat'}</p>
              <p className="text-xs text-gray-500">
                {new Date(chat.timestamp).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={(e) => handleDelete(e, chat.id)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
        <p className="text-xs text-gray-500">Storage used: {storageSize}</p>
      </div>
    </div>
  );
}
