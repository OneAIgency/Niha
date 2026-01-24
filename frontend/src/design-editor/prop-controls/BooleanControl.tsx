interface BooleanControlProps {
  label: string;
  value: boolean;
  optional: boolean;
  onChange: (value: boolean) => void;
}

export function BooleanControl({ label, value, optional, onChange }: BooleanControlProps) {
  const isChecked = value ?? false;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!isChecked);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-navy-900 dark:text-white">
        {label}
        {optional && (
          <span className="ml-1 text-xs text-navy-500 dark:text-navy-500">
            (optional)
          </span>
        )}
      </label>
      <button
        onClick={() => onChange(!isChecked)}
        onKeyDown={handleKeyDown}
        className={`relative h-6 w-11 rounded-full transition-all ${
          isChecked
            ? 'bg-emerald-500'
            : 'bg-navy-300 dark:bg-navy-600'
        }`}
        role="switch"
        aria-checked={isChecked}
        aria-label={label}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
            // eslint-disable-next-line no-restricted-syntax
            isChecked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
