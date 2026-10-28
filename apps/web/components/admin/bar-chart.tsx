'use client';

import { useId, useState } from 'react';

export interface BarDatum {
  label: string;
  value: number;
  /** Texte formaté pour tooltip et tableau */
  display: string;
}

/**
 * Histogramme mono-série en SVG : barres fines à extrémité arrondie, grille discrète,
 * infobulle au survol/focus, tableau de données accessible en alternative.
 */
export function BarChart({ data, title, tableLabel }: { data: BarDatum[]; title: string; tableLabel: string }) {
  const id = useId();
  const [active, setActive] = useState<number | null>(null);
  const W = 640;
  const H = 220;
  const pad = { top: 16, bottom: 28, left: 8, right: 8 };
  const max = Math.max(1, ...data.map((d) => d.value));
  const slot = (W - pad.left - pad.right) / Math.max(1, data.length);
  const barW = Math.min(36, slot * 0.6);
  const y = (v: number) => pad.top + (H - pad.top - pad.bottom) * (1 - v / max);

  return (
    <figure className="flex flex-col gap-2">
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-labelledby={`${id}-title`}>
          <title id={`${id}-title`}>{title}</title>
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line key={f} x1={pad.left} x2={W - pad.right} y1={y(max * f)} y2={y(max * f)} className="stroke-border" strokeDasharray="2 4" strokeWidth={1} />
          ))}
          <line x1={pad.left} x2={W - pad.right} y1={y(0)} y2={y(0)} className="stroke-border" strokeWidth={1} />
          {data.map((d, i) => {
            const x = pad.left + slot * i + (slot - barW) / 2;
            const top = y(d.value);
            const h = Math.max(0, y(0) - top);
            const r = Math.min(4, h);
            return (
              <g
                key={d.label}
                tabIndex={0}
                aria-label={`${d.label} : ${d.display}`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="cursor-default outline-none"
              >
                {/* zone de survol plus large que la barre */}
                <rect x={pad.left + slot * i} y={pad.top} width={slot} height={H - pad.top - pad.bottom} fill="transparent" />
                <path
                  d={`M${x},${y(0)} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${y(0)} Z`}
                  className={active === null || active === i ? 'fill-primary' : 'fill-primary/40'}
                />
                <text x={x + barW / 2} y={H - 8} textAnchor="middle" className="fill-text-muted text-[11px]">
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
        {active !== null && data[active] && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs shadow-lg"
            style={{ left: `${((pad.left + slot * active + slot / 2) / W) * 100}%`, top: `${(y(data[active].value) / H) * 100}%` }}
            role="status"
          >
            <span className="block text-text-muted">{data[active].label}</span>
            <span className="font-semibold text-text">{data[active].display}</span>
          </div>
        )}
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-text-muted">{tableLabel}</summary>
        <table className="mt-2 w-full">
          <tbody>
            {data.map((d) => (
              <tr key={d.label} className="border-b border-border">
                <th scope="row" className="py-1 text-start font-normal">{d.label}</th>
                <td className="py-1 text-end tabular-nums">{d.display}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
