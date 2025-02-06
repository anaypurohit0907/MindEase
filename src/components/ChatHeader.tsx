import { Button } from "@/components/ui/button";
import { Rocket, Plus } from "lucide-react";

interface ChatHeaderProps {
  onNewChat: () => void;
}

export function ChatHeader({ onNewChat }: ChatHeaderProps) {
  return (
    <div className="p-2 border-b border-zinc-800 flex items-center justify-between">
      <div className="flex items-center bg-zinc-800/50 rounded-full px-2 py-1.5 border border-zinc-700/50 shadow-lg">
        <div className="flex items-center justify-center w-7 h-7 rounded-full border-2 border-blue-500 mr-2 relative overflow-hidden bg-blue-500/10">
          <Rocket 
            size={15} 
            className="text-blue-500 transform rotate-45 relative -translate-y-[1px]" 
            strokeWidth={2.5}
          />
          <div className="absolute bottom-0 w-2 h-2 bg-blue-500/30 rounded-full blur-[2px] animate-pulse" />
        </div>
        <span className="text-sm font-medium text-zinc-200 font-['Inter'] tracking-wide">
          R-Chat
        </span>
      </div>
      
      <Button
        onClick={onNewChat}
        size="icon"
        variant="outline"
        className="h-8 w-8 rounded-full bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600"
      >
        <Plus className="h-4 w-4 text-zinc-400" />
      </Button>
    </div>
  );
}
