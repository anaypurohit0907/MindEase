"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatInput } from "@/components/ChatInput";
import { MessageBubble } from "@/components/MessageBubble";
import { ChatList } from '@/components/ChatList';

interface Message {
  id: string;
  text: string;
  thinking?: string;
  isUser: boolean;
  timestamp?: number;
}

interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
  messages: Message[];
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'initial',
      text: "What's on your mind?", 
      isUser: false, 
      timestamp: Date.now() 
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [controller, setController] = useState<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [selectedModel, setSelectedModel] = useState("deepseek-r1:1.5b");
  const [hideThinking, setHideThinking] = useState(false);

  // Remove unused state
  const [currentResponse] = useState("");
  
  // More robust ID generator
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const loadCurrentChat = () => {
      if (currentChatId) {
        const storedChats = localStorage.getItem('chatSessions');
        if (storedChats) {
          const chats: ChatSession[] = JSON.parse(storedChats);
          const currentChat = chats.find(c => c.id === currentChatId);
          if (currentChat) {
            // Don't load empty chats, instead reset to initial state
            if (currentChat.messages.length === 0) {
              setCurrentChatId(null);
              setMessages([{ 
                id: 'initial',
                text: "What's on your mind?", 
                isUser: false,
                timestamp: Date.now()
              }]);
              return;
            }
            setMessages(currentChat.messages);
          }
        }
      } else if (!messages.some(msg => msg.id !== 'initial')) {
        // If current chat is empty (only has initial message), keep it
        // instead of creating a new one
        setMessages([{ 
          id: 'initial',
          text: "What's on your mind?", 
          isUser: false,
          timestamp: Date.now()
        }]);
      }
    };

    loadCurrentChat();
  }, [currentChatId]);

  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setShowScrollTop(container.scrollTop > 500);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStopGeneration = () => {
    controller?.abort();
    setIsLoading(false);
    setIsThinking(false);
    // Keep the partial response without adding "Generation stopped"
    saveCurrentChat(messages);
  };

  const handleResend = async (messageToResend: string) => {
    if (!isLoading) {
      setInput(messageToResend);
      await handleSubmit(messageToResend);
    }
  };

  const formatConversationHistory = (messages: Message[]) => {
    // Filter out the initial greeting message
    const relevantMessages = messages.filter(msg => msg.id !== 'initial');
    return relevantMessages
      .map(msg => `${msg.isUser ? 'Human' : 'Assistant'}: ${msg.text}`)
      .join('\n\n');
  };

  // Single source of truth for saving chats
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSaveRef = useRef<string>('');

  const saveCurrentChat = useCallback((newMessages: Message[]) => {
    if (!newMessages || newMessages.length === 0) return;
    
    // Don't save if it's only the initial message or empty chat
    const hasRealMessages = newMessages.some(msg => msg.id !== 'initial');
    if (!hasRealMessages) return;
    
    const chatId = currentChatId || `chat-${Date.now()}`;
    
    // Create message hash to check for changes
    const messageHash = JSON.stringify(newMessages);
    if (messageHash === lastSaveRef.current) return;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save operation
    saveTimeoutRef.current = setTimeout(() => {
      try {
        const existingChats = JSON.parse(localStorage.getItem('chatSessions') || '[]');
        
        // Filter out empty, duplicate, and "New Chat" titled chats
        const validChats = Array.from(
          new Map(
            existingChats
              .filter((chat: ChatSession) => 
                chat.messages.some(msg => msg.id !== 'initial') && 
                chat.title !== 'New Chat'
              )
              .map((chat: ChatSession) => [chat.id, chat])
          ).values()
        );

        // Get first user message for title
        const firstUserMessage = newMessages.find(m => m.isUser)?.text;
        if (!firstUserMessage) return; // Don't save if no user message exists

        const chatSession: ChatSession = {
          id: chatId,
          title: firstUserMessage.slice(0, 30),
          timestamp: Date.now(),
          messages: newMessages
        };

        const otherChats = validChats.filter(chat => chat.id !== chatId);
        localStorage.setItem('chatSessions', JSON.stringify([chatSession, ...otherChats]));
        
        if (!currentChatId) {
          setCurrentChatId(chatId);
        }

        lastSaveRef.current = messageHash;
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('chatsUpdated'));
        });
      } catch (error: unknown) {
        console.error('Error saving chat:', error);
      }
    }, 2000);
    
  }, [currentChatId]);

  // Update the storage event listener
  useEffect(() => {
    const handleStorage = () => {
      // Reload chats only if needed
      if (!currentChatId) return;
      
      const storedChats = localStorage.getItem('chatSessions');
      if (storedChats) {
        const chats: ChatSession[] = JSON.parse(storedChats);
        const currentChat = chats.find(c => c.id === currentChatId);
        if (currentChat) {
          setMessages(currentChat.messages);
        }
      }
    };

    window.addEventListener('chatsUpdated', handleStorage);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('chatsUpdated', handleStorage);
      window.removeEventListener('storage', handleStorage);
    };
  }, [currentChatId]);

  const handleNewChat = () => {
    const hasConversation = messages.some(msg => msg.id !== 'initial');
    
    if (!hasConversation) {
      // Already on an empty chat, do nothing
      return;
    }
    
    if (messages.length > 1) {
      saveCurrentChat(messages);
    }
    
    setCurrentChatId(null);
    setMessages([{ 
      id: 'initial',
      text: "What's on your mind?", 
      isUser: false,
      timestamp: Date.now()
    }]);
  };

  // Single effect for auto-saving
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const timeoutId = setTimeout(() => {
        saveCurrentChat(messages);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [messages, isLoading, saveCurrentChat]);

  const handleDeleteChat = async (chatId: string) => {
    try {
      const storedChats = JSON.parse(localStorage.getItem('chatSessions') || '[]');
      const updatedChats = storedChats.filter((chat: any) => chat.id !== chatId);
      
      // Update storage first
      await localStorage.setItem('chatSessions', JSON.stringify(updatedChats));
      
      // Then update UI
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([{ 
          id: generateId(),
          text: "What's on your mind?", 
          isUser: false,
          timestamp: Date.now()
        }]);
      }
      
      // Force storage event to update sidebar
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  // Replace the formatEquation function with a simpler content formatter
  const formatContent = (text: string) => {
    return text
      // Format numbered lists with proper spacing
      .replace(/(\d+\.)\s+/g, '\n$1 ')
      
      // Format basic integrals and mathematical expressions
      .replace(/\[([^\]]+)\]/g, (_, equation) => {
        // Clean up the equation
        return equation
          .replace(/\\int/g, '∫')  // Replace integral symbol
          .replace(/\\frac{([^}]+)}{([^}]+)}/g, '$1/$2')  // Convert fractions to division
          .replace(/\\quad/g, '  ')  // Replace quad with spaces
          .replace(/\\neq/g, '≠')  // Not equal symbol
          .replace(/\\ln/g, 'ln')  // Natural log
          .replace(/dx/g, ' dx')   // Add space before dx
          .replace(/du/g, ' du')   // Add space before du
          .replace(/[{}\\]/g, '')  // Remove LaTeX artifacts
          .trim();
      })
      
      // Handle special math symbols
      .replace(/\(([^)]+)\)/g, '($1)')  // Keep parentheses clean
      .replace(/\|([^|]+)\|/g, '|$1|')  // Keep absolute value symbols
      
      // Handle code output blocks
      .replace(
        /When you run this program, it will output:([\s\S]+?)(?=\n\n|$)/g,
        (_, output) => `\nOutput:\n\`\`\`\n${output.trim()}\n\`\`\`\n`
      )

      // Clean up multiple spaces and lines while preserving intentional spacing
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const handleSubmit = async (messageToSend?: string | null) => {
    // Fix message text handling
    const messageText = typeof messageToSend === 'string' 
      ? messageToSend 
      : input;

    if (messageText.trim() && !isLoading) {
      setIsLoading(true);
      setIsThinking(true);

      const newController = new AbortController();
      setController(newController);

      // Always filter out initial message before adding new ones
      const currentMessages = messages.filter(msg => msg.id !== 'initial');
      
      const userMessage = { 
        id: generateId(),
        text: messageText, 
        isUser: true, 
        timestamp: Date.now() 
      };

      // Set messages without the initial message
      const updatedMessages = [...currentMessages, userMessage];
      setMessages(updatedMessages);
      setInput("");

      try {
        // Use the filtered messages for context
        const recentMessages = updatedMessages.slice(-10);
        const conversationHistory = formatConversationHistory(recentMessages);

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: messageText,
            context: conversationHistory,
            model: selectedModel
          }),
          signal: newController.signal
        });

        if (!response.ok) throw new Error('Failed to get response');

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader available');

        // Add assistant message
        const assistantMessage = { 
          id: generateId(),
          text: '', 
          thinking: '', 
          isUser: false 
        };
        
        const messagesWithAssistant = [...updatedMessages, assistantMessage];
        setMessages(messagesWithAssistant);
        
        // Initial save
        saveCurrentChat(messagesWithAssistant);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunks = new TextDecoder()
            .decode(value)
            .split('\n')
            .filter(Boolean)
            .map(chunk => JSON.parse(chunk));

          for (const chunk of chunks) {
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage && !lastMessage.isUser) {
                lastMessage.thinking = chunk.thinking;
                lastMessage.text = formatContent(chunk.response);
              }
              return newMessages;
            });

            if (chunk.done) {
              setIsThinking(false);
              // Final save after completion
              setMessages(prev => {
                saveCurrentChat(prev);
                return prev;
              });
            }
          }
        }
      } catch (error) {
        // In case of error, don't bring back the initial message
        setMessages(prev => prev.filter(msg => msg.id !== 'initial'));
        // ...existing error handling...
      } finally {
        setController(null);
        setIsLoading(false);
        setIsThinking(false);
      }
    }
  };

  const forceStorageUpdate = () => {
    window.dispatchEvent(new Event('storage'));
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isNearBottom);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-900">
      <div className="w-64 flex-shrink-0 fixed top-0 bottom-0 left-0 flex flex-col border-r border-zinc-800 bg-zinc-900 z-50">
        <ChatHeader onNewChat={handleNewChat} />
        <div className="flex-1 overflow-y-auto">
          <ChatList
            currentChatId={currentChatId}
            onChatSelect={setCurrentChatId}
            onDeleteChat={handleDeleteChat}
          />
        </div>
      </div>
      <main className="flex-1 ml-64 relative">
        <div 
          ref={containerRef}
          className="h-full overflow-y-auto px-6 pt-4 pb-32"
          onScroll={handleScroll}
        >
          {messages.map((message, i) => (
            <MessageBubble
              key={message.id}
              message={message}
              isThinking={isThinking}
              isLatest={i === messages.length - 1}
              hideThinking={hideThinking}
              onResend={message.isUser ? () => handleResend(message.text) : undefined}
              showResend={i === messages.length - 2 && !isLoading} // Show resend on last user message when not loading
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="pointer-events-none absolute inset-0">
          <div className="pointer-events-auto absolute inset-x-0 bottom-0 max-w-3xl mx-auto">
            <ChatInput
              input={input}
              isLoading={isLoading}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              onStopGeneration={handleStopGeneration}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              hideThinking={hideThinking}
              onHideThinkingChange={setHideThinking}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
