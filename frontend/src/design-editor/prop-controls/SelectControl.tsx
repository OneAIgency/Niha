interface SelectControlProps {
  label: string;
  value: string;
  optional: boolean;
  options: string[];
  onChange: (value: string) => void;
}

export function SelectControl({ label, value, optional, options, onChange }: SelectControlProps) {
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
      <select
        value={value ?? options[0]}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border-2 border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 px-4 py-2 text-navy-900 dark:text-white transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
