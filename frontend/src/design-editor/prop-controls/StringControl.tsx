interface StringControlProps {
  label: string;
  value: string;
  optional: boolean;
  onChange: (value: string) => void;
}

export function StringControl({ label, value, optional, onChange }: StringControlProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-navy-900 dark:text-white">
        {label}
        {optional && (
          <span className="ml-1 text-xs text-navy-500 dark:text-navy-500">
            (optional)
          </span>
        )}
      </label>
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${label.toLowerCase()}...`}
        className="w-full rounded-lg border-2 border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 px-4 py-2 text-navy-900 dark:text-white placeholder-navy-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  );
}
