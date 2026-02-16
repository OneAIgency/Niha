import type { ReactNode } from 'react';

/* ── Metric highlighting ─────────────────────────────────── */

/** Brighten numbers, currencies, percentages, ratios within text */
function hl(text: string): ReactNode[] {
  const rx =
    /(€[\d,.]+[BMK]?(?:[-–]€?[\d,.]+[BMK]?)?(?:\/\w+)?|¥[\d,.]+[BMK]?(?:[-–]¥?[\d,.]+[BMK]?)?(?:\/\w+)?|\d+(?:\.\d+)?[-–]\d+(?:\.\d+)?%|\d+(?:\.\d+)?%|\d+[-–]?\d*×|T\+\d+|\d{1,3}(?:,\d{3})+\+?)/g;

  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <span key={m.index} className="text-navy-200 font-medium">
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/* ── Paragraph splitting ─────────────────────────────────── */

/** Split text into ~2-sentence paragraphs for visual breathing room */
function toParagraphs(text: string): string[] {
  const sentences = text.split(/(?<=\.)\s+(?=[A-Z])/);
  if (sentences.length <= 2) return [text];
  const result: string[] = [];
  for (let i = 0; i < sentences.length; i += 2)
    result.push(sentences.slice(i, i + 2).join(' '));
  return result;
}

/* ── Main component ──────────────────────────────────────── */

/** Renders a plain-text string with rich visual formatting */
export function RichText({ text }: { text: string }) {
  // ── Numbered list: (1) ... (2) ... ──
  // Require (1) and (2) to exist — avoids false positives from years like (2024)
  if (text.includes('(1)') && text.includes('(2)')) {
    const start = text.indexOf('(1)');
    const intro = start > 0 ? text.slice(0, start).replace(/[:\s]+$/, '').trim() : '';
    const items = text
      .slice(start)
      .split(/\(\d+\)\s*/)
      .filter((s) => s.trim())
      .map((s) => s.replace(/[.,;]\s*$/, '').trim());

    return (
      <div className="space-y-3">
        {intro && <p>{hl(intro)}</p>}
        <div className="space-y-2 ml-1">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[10px] text-emerald-400 font-medium mt-0.5">
                {i + 1}
              </span>
              <p className="flex-1">{hl(item)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Step list: Step 1 (label): ... ──
  // Require Step 1 and Step 2 to exist
  if (text.includes('Step 1') && text.includes('Step 2')) {
    const start = text.indexOf('Step 1');
    const intro = start > 0 ? text.slice(0, start).replace(/[:\s]+$/, '').trim() : '';
    const parts = text.slice(start).split(/Step \d+\s*(?:\(([^)]*)\))?\s*:\s*/);
    const items: { label: string; body: string }[] = [];
    for (let i = 1; i < parts.length; i += 2) {
      const label = parts[i] ?? '';
      const body = (parts[i + 1] ?? '').replace(/\.\s*$/, '').trim();
      if (body) items.push({ label, body });
    }

    return (
      <div className="space-y-3">
        {intro && <p>{hl(intro)}</p>}
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3 pl-1">
              <div className="flex-shrink-0 w-6 h-6 rounded bg-navy-700/80 flex items-center justify-center text-xs text-navy-300 font-mono font-medium mt-0.5">
                {i + 1}
              </div>
              <div className="flex-1">
                {item.label && (
                  <span className="text-navy-200 font-medium">{item.label}: </span>
                )}
                <span>{hl(item.body)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Default: paragraph split with metric highlighting ──
  const paras = toParagraphs(text);
  if (paras.length <= 1) return <>{hl(text)}</>;

  return (
    <div className="space-y-2.5">
      {paras.map((p, i) => (
        <p key={i}>{hl(p)}</p>
      ))}
    </div>
  );
}
