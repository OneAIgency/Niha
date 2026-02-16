interface GridRow {
  label: string;
  values: { text: string; status: 'yes' | 'no' | 'partial' }[];
}

interface Props {
  headers: string[];
  rows: GridRow[];
  title?: string;
}

const STATUS = {
  yes: { sym: '\u2713', cls: 'text-emerald-400' },
  no: { sym: '\u2717', cls: 'text-red-400' },
  partial: { sym: '~', cls: 'text-amber-400' },
} as const;

export function MiniCheckGrid({ headers, rows, title }: Props) {
  return (
    <div className="my-3">
      {title && <div className="text-[10px] uppercase tracking-wider text-navy-500 mb-2">{title}</div>}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-[10px] text-navy-500 font-medium pb-1.5 pr-2" />
              {headers.map((h) => (
                <th key={h} className="text-left text-[10px] text-navy-500 font-medium pb-1.5 px-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-navy-800/50">
                <td className="text-[10px] text-navy-300 font-medium py-1 pr-2 whitespace-nowrap">{row.label}</td>
                {row.values.map((val, i) => {
                  const s = STATUS[val.status];
                  return (
                    <td key={i} className="py-1 px-2">
                      <span className={`text-[10px] ${s.cls} mr-1`}>{s.sym}</span>
                      <span className="text-[10px] text-navy-400">{val.text}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
