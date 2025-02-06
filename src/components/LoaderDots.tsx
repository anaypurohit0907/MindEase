export function LoaderDots() {
  return (
    <div className="flex items-center gap-1">
      <div className="w-1 h-1 rounded-full bg-zinc-400 animate-pulse" />
      <div className="w-1 h-1 rounded-full bg-zinc-400 animate-pulse [animation-delay:150ms]" />
      <div className="w-1 h-1 rounded-full bg-zinc-400 animate-pulse [animation-delay:300ms]" />
    </div>
  );
}
