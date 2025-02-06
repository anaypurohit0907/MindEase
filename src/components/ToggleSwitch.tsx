interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export default function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`
          w-10 h-6 rounded-full transition-colors duration-200 ease-in-out
          ${checked ? 'bg-black dark:bg-white' : 'bg-gray-200 dark:bg-zinc-700'}
        `}>
          <div className={`
            absolute left-1 top-1 w-4 h-4 rounded-full transition-transform duration-200 ease-in-out
            ${checked ? 'translate-x-4 bg-white dark:bg-black' : 'translate-x-0 bg-gray-500 dark:bg-gray-400'}
          `} />
        </div>
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors">
        {label}
      </span>
    </label>
  );
}
