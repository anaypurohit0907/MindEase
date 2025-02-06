export default function LoadingDots() {
  return (
    <div className="flex space-x-1.5 items-center">
      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-[bounce_1.4s_infinite_.2s]" />
      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-[bounce_1.4s_infinite_.4s]" />
      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-[bounce_1.4s_infinite_.6s]" />
    </div>
  );
}
