import { useEffect, useState } from 'react';
import { Trash2, Database } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';

interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
}

interface ChatListProps {
  currentChatId: string | null;
  onChatSelect: (id: string) => void;
  onDeleteChat: (id: string) => void;
}

export function ChatList({ currentChatId, onChatSelect, onDeleteChat }: ChatListProps) {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [storageSize, setStorageSize] = useState('0 KB');

  // Add storage size calculation
  const calculateStorageSize = () => {
    try {
      const stored = localStorage.getItem('chatSessions') || '[]';
      const bytes = new Blob([stored]).size;
      const kb = bytes / 1024;
      const mb = kb / 1024;
      
      setStorageSize(mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`);
    } catch (error) {
      console.error('Error calculating storage size:', error);
      setStorageSize('0 KB');
    }
  };

  useEffect(() => {
    const loadChats = () => {
      try {
        const stored = localStorage.getItem('chatSessions');
        if (stored) {
          const sessions = JSON.parse(stored);
          // Deduplicate chats based on ID and get values directly
          const uniqueChats = Array.from(
            new Map(sessions.map((chat: ChatSession) => [chat.id, chat])).values()
          ) as ChatSession[];
          
          setChats(uniqueChats.sort((a, b) => b.timestamp - a.timestamp));
        }
        calculateStorageSize();
      } catch (error) {
        console.error('Error loading chats:', error);
      }
    };

    // Load initial chats
    loadChats();

    // Debounce storage updates
    const handleStorageUpdate = debounce(loadChats, 100);
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('chatsUpdated', handleStorageUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('chatsUpdated', handleStorageUpdate);
    };
  }, []);

  // Improved debounce helper with proper types
  function debounce<T extends (...args: never[]) => void>(
    fn: T,
    ms: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), ms);
    };
  }

  const handleDeleteAll = () => {
    try {
      localStorage.removeItem('chatSessions');
      setChats([]); // Update local state immediately
      calculateStorageSize();
      // Force ChatList component update
      window.dispatchEvent(new CustomEvent('chatsUpdated'));
    } catch (error) {
      console.error('Error deleting all chats:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="px-2 py-4 space-y-1.5">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`group flex items-center px-3 py-2 cursor-pointer rounded-lg transition-colors ${
                currentChatId === chat.id 
                  ? 'bg-zinc-800 text-zinc-100' 
                  : 'hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'
              }`}
              onClick={() => onChatSelect(chat.id)}
            >
              <span className="flex-1 truncate text-sm relative group-hover:after:content-['...'] group-hover:after:ml-0.5 group-hover:after:opacity-0">
                {chat.title}
                {chat.title.length > 28 && (
                  <span className="absolute right-0 top-0 opacity-100">...</span>
                )}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-700 rounded-md transition-opacity"
              >
                <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="p-2 border-t border-zinc-800 space-y-2">
        {/* Storage indicator */}
        <div className="flex items-center justify-between px-2 py-1 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Database className="w-3 h-3" />
            <span>Storage</span>
          </div>
          <span>{storageSize}</span>
        </div>

        {chats.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full text-red-400 hover:text-red-300 hover:bg-red-900/10 border-zinc-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All Chats
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-zinc-900 border-zinc-800">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete All Chats</AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-400">
                  This action cannot be undone. This will permanently delete all your chat history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-zinc-800 border-zinc-700 hover:bg-zinc-800/80">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAll}
                  className="bg-red-600 hover:bg-red-700 text-white border-0"
                >
                  Delete All
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}
