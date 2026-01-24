interface NumberControlProps {
  label: string;
  value: number;
  optional: boolean;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function NumberControl({ label, value, optional, onChange, min, max }: NumberControlProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    // Allow empty string (user clearing input)
    if (val === '') {
      onChange(0);
      return;
    }

    const num = parseFloat(val);
    if (!isNaN(num)) {
      onChange(num);
    }
    // If invalid, don't call onChange (input stays at current value)
  };

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
        type="number"
        value={value ?? 0}
        onChange={handleChange}
        placeholder={`Enter ${label.toLowerCase()}...`}
        min={min}
        max={max}
        className="w-full rounded-lg border-2 border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 px-4 py-2 text-navy-900 dark:text-white placeholder-navy-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  );
}
