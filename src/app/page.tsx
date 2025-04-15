"use client";

import { ChatHeader } from "@/components/ChatHeader";
import { ChatInput } from "@/components/ChatInput";
import { ChatList } from "@/components/ChatList";
import { MessageBubble } from "@/components/MessageBubble";
import { useCallback, useEffect, useRef, useState } from "react";

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
  const [messages, setMessages] = useState<Message[]>(() => [{
    id: 'initial',
    text: "What's on your mind?",
    isUser: false,
    timestamp: Date.now()
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [controller, setController] = useState<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState("gemini-api");
  const [hideThinking, setHideThinking] = useState(false);

  const generateId = () =>
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const loadCurrentChat = () => {
      if (currentChatId) {
        const storedChats = localStorage.getItem("chatSessions");
        if (storedChats) {
          const chats: ChatSession[] = JSON.parse(storedChats);
          const currentChat = chats.find((c) => c.id === currentChatId);
          if (currentChat) {
            if (currentChat.messages.length === 0) {
              setCurrentChatId(null);
              setMessages([
                {
                  id: "initial",
                  text: "What's on your mind?",
                  isUser: false,
                  timestamp: Date.now(),
                },
              ]);
              return;
            }
            setMessages(currentChat.messages);
          }
        }
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
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShouldAutoScroll(scrollHeight - scrollTop - clientHeight < 100);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const handleStopGeneration = () => {
    controller?.abort();
    setIsLoading(false);
    setIsThinking(false);
    saveCurrentChat(messages);
  };

  const handleResend = async (messageToResend: string) => {
    if (!isLoading) {
      setInput(messageToResend);
      await handleSubmit(messageToResend);
    }
  };

  const formatConversationHistory = (messages: Message[]) => {
    const relevantMessages = messages.filter((msg) => msg.id !== "initial");
    return relevantMessages
      .map((msg) => `${msg.isUser ? "User" : "Assistant"}: ${msg.text}`)
      .join("\n\n");
  };

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<string>("");

  const saveCurrentChat = useCallback(
    (newMessages: Message[]) => {
      if (!newMessages || newMessages.length === 0) return;

      const hasRealMessages = newMessages.some((msg) => msg.id !== "initial");
      if (!hasRealMessages) return;

      const chatId = currentChatId || `chat-${Date.now()}`;

      const messageHash = JSON.stringify(newMessages);
      if (messageHash === lastSaveRef.current) return;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        try {
          const existingChats = JSON.parse(
            localStorage.getItem("chatSessions") || "[]"
          ) as ChatSession[];

          const validChats = Array.from(
            new Map(
              existingChats
                .filter(
                  (chat: ChatSession) =>
                    chat.messages.some((msg) => msg.id !== "initial") &&
                    chat.title !== "New Chat"
                )
                .map((chat: ChatSession) => [chat.id, chat])
            ).values()
          );

          const firstUserMessage = newMessages.find((m) => m.isUser)?.text;
          if (!firstUserMessage) return;

          const chatSession: ChatSession = {
            id: chatId,
            title: firstUserMessage.slice(0, 30),
            timestamp: Date.now(),
            messages: newMessages,
          };

          const otherChats = validChats.filter((chat) => chat.id !== chatId);
          localStorage.setItem(
            "chatSessions",
            JSON.stringify([chatSession, ...otherChats])
          );

          if (!currentChatId) {
            setCurrentChatId(chatId);
          }

          lastSaveRef.current = messageHash;
          requestAnimationFrame(() => {
            window.dispatchEvent(new CustomEvent("chatsUpdated"));
          });
        } catch (error) {
          console.error("Error saving chat", error);
        }
      }, 2000);
    },
    [currentChatId]
  );

  useEffect(() => {
    const handleStorage = () => {
      if (!currentChatId) return;

      const storedChats = localStorage.getItem("chatSessions");
      if (storedChats) {
        const chats: ChatSession[] = JSON.parse(storedChats);
        const currentChat = chats.find((c) => c.id === currentChatId);
        if (currentChat) {
          setMessages(currentChat.messages);
        }
      }
    };

    window.addEventListener("chatsUpdated", handleStorage);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("chatsUpdated", handleStorage);
      window.removeEventListener("storage", handleStorage);
    };
  }, [currentChatId]);

  const handleNewChat = () => {
    const hasConversation = messages.some((msg) => msg.id !== "initial");

    if (!hasConversation) {
      return;
    }

    if (messages.length > 1) {
      saveCurrentChat(messages);
    }

    setCurrentChatId(null);
    setMessages([
      {
        id: "initial",
        text: "What's on your mind?",
        isUser: false,
        timestamp: Date.now(),
      },
    ]);
  };

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
      const storedChats = JSON.parse(
        localStorage.getItem("chatSessions") || "[]"
      );
      const updatedChats = storedChats.filter(
        (chat: ChatSession) => chat.id !== chatId
      );

      await localStorage.setItem("chatSessions", JSON.stringify(updatedChats));

      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([
          {
            id: generateId(),
            text: "What's on your mind?",
            isUser: false,
            timestamp: Date.now(),
          },
        ]);
      }

      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.error("Error deleting chat:", err);
    }
  };

  const handleSubmit = async (messageToSend?: string | null) => {
    const messageText =
      typeof messageToSend === "string" ? messageToSend : input;

    if (messageText.trim() && !isLoading) {
      setIsLoading(true);
      setIsThinking(true);

      try {
        const newController = new AbortController();
        setController(newController);

        const currentMessages = messages.filter((msg) => msg.id !== "initial");

        const userMessage = {
          id: generateId(),
          text: messageText,
          isUser: true,
          timestamp: Date.now(),
        };

        const updatedMessages = [...currentMessages, userMessage];
        setMessages(updatedMessages);
        setInput("");

        try {
          const recentMessages = updatedMessages.slice(-10);
          const conversationHistory = formatConversationHistory(recentMessages);

          let apiKey = null;
          if (selectedModel === "gemini-api") {
            apiKey = localStorage.getItem("geminiApiKey");
          }

          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: messageText,
              context: conversationHistory,
              model: selectedModel,
              apiKey,
            }),
            signal: newController.signal,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to get response");
          }

          const reader = response.body?.getReader();
          if (!reader) throw new Error("No reader available");

          const assistantMessage = {
            id: generateId(),
            text: "",
            thinking: "",
            isUser: false,
          };

          const messagesWithAssistant = [...updatedMessages, assistantMessage];
          setMessages(messagesWithAssistant);

          saveCurrentChat(messagesWithAssistant);

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = new TextDecoder().decode(value);
            const lines = text.split("\n").filter(Boolean);

            for (const line of lines) {
              try {
                const chunk = JSON.parse(line);
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage && !lastMessage.isUser) {
                    lastMessage.thinking =
                      chunk.thinking ?? lastMessage.thinking ?? "";
                    lastMessage.text = chunk.response ?? lastMessage.text ?? "";

                    if (chunk.isThinking !== undefined) {
                      setIsThinking(chunk.isThinking);
                    }
                  }
                  return newMessages;
                });

                if (chunk.done) {
                  setIsThinking(false);
                  setMessages((prev) => {
                    const finalMessages = [...prev];
                    const lastMessage = finalMessages[finalMessages.length - 1];
                    if (lastMessage && !lastMessage.isUser) {
                      lastMessage.thinking =
                        chunk.thinking ?? lastMessage.thinking ?? "";
                      lastMessage.text =
                        chunk.response ?? lastMessage.text ?? "";
                    }
                    saveCurrentChat(finalMessages);
                    return finalMessages;
                  });
                }
              } catch (jsonError) {
                console.warn("Error parsing chunk:", jsonError);
                continue;
              }
            }
          }
        } catch (error) {
          console.error("Error during chat:", error);
          setMessages((prev) => [
            ...prev,
            {
              id: generateId(),
              text:
                error instanceof Error
                  ? error.message
                  : "An error occurred. Please check your API key in the .env file.",
              isUser: false,
              timestamp: Date.now(),
            },
          ]);
        } finally {
          setController(null);
          setIsLoading(false);
          setIsThinking(false);
        }
      } catch (error) {
        console.error("Error during chat:", error);
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            text:
              error instanceof Error
                ? error.message
                : "Failed to connect. Please check your API key and try again.",
            isUser: false,
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setController(null);
        setIsLoading(false);
        setIsThinking(false);
      }
    }
  };

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isNearBottom);
  }, []);

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
              onResend={
                message.isUser ? () => handleResend(message.text) : undefined
              }
              showResend={i === messages.length - 2 && !isLoading}
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
