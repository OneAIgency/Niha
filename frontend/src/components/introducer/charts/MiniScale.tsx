interface ScaleSide {
  label: string;
  value: string;
  numericValue: number;
  color: string;
}

interface Props {
  left: ScaleSide;
  right: ScaleSide;
  ratio?: string;
  title?: string;
}

export function MiniScale({ left, right, ratio, title }: Props) {
  const max = Math.max(left.numericValue, right.numericValue, 1);

  return (
    <div className="my-3">
      {title && <div className="text-[10px] uppercase tracking-wider text-navy-500 mb-2">{title}</div>}
      <div className="space-y-1.5">
        {[left, right].map((side) => {
          const pct = Math.max((side.numericValue / max) * 100, 4);
          return (
            <div key={side.label} className="flex items-center gap-2">
              <span className="text-[10px] text-navy-400 w-16 text-right flex-shrink-0">{side.label}</span>
              <div className="flex-1 bg-navy-900/50 rounded-full h-5 overflow-hidden relative">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, background: side.color, opacity: 0.4 }}
                />
                <span className="absolute inset-y-0 left-2 flex items-center text-[10px] font-mono text-white/90">
                  {side.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {ratio && (
        <div className="text-center mt-1.5">
          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">{ratio}</span>
        </div>
      )}
    </div>
  );
}
