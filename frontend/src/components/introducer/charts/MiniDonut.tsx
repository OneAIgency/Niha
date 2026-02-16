interface Segment {
  label: string;
  value: number;
  color: string;
}

interface Props {
  segments: Segment[];
  size?: number;
  title?: string;
}

export function MiniDonut({ segments, size = 90, title }: Props) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const r = 34;
  const strokeW = 12;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="my-3 flex items-center gap-4">
      <div className="flex-shrink-0">
        {title && <div className="text-[10px] uppercase tracking-wider text-navy-500 mb-1">{title}</div>}
        <svg viewBox="0 0 100 100" width={size} height={size}>
          {segments.map((seg) => {
            const pct = seg.value / total;
            const dash = pct * circ;
            const cur = offset;
            offset += dash;
            return (
              <circle
                key={seg.label}
                cx={50} cy={50} r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeW}
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={-cur}
                opacity={0.55}
                transform="rotate(-90 50 50)"
              />
            );
          })}
        </svg>
      </div>
      <div className="flex flex-col gap-1">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: seg.color, opacity: 0.55 }} />
            <span className="text-[10px] text-navy-400">{seg.label}</span>
            <span className="text-[10px] text-navy-300 font-mono ml-auto">{Math.round((seg.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
