"use client";

import { useState } from "react";

type Point = { date: string; tokens: number };

const WIDTH = 760;
const HEIGHT = 200;
const PADDING_LEFT = 8;
const PADDING_RIGHT = 8;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 28;
const GAP = 2;

export function UsageChart({ data }: { data: Point[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const plotWidth = WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const barWidth = Math.max((plotWidth - GAP * (data.length - 1)) / data.length, 1);
  const maxTokens = Math.max(...data.map((d) => d.tokens), 1);
  const hovered = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div
      className="viz-root relative rounded-lg border p-4"
      style={{ borderColor: "var(--viz-grid)", background: "var(--viz-surface)" }}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        style={{ height: HEIGHT }}
        role="img"
        aria-label="Daily token usage, last 30 days"
      >
        <line
          x1={PADDING_LEFT}
          y1={PADDING_TOP + plotHeight}
          x2={WIDTH - PADDING_RIGHT}
          y2={PADDING_TOP + plotHeight}
          stroke="var(--viz-baseline)"
          strokeWidth={1}
        />

        {data.map((d, i) => {
          const barHeight = maxTokens === 0 ? 0 : (d.tokens / maxTokens) * plotHeight;
          const x = PADDING_LEFT + i * (barWidth + GAP);
          const y = PADDING_TOP + plotHeight - barHeight;
          const isHovered = hoverIndex === i;
          return (
            <g key={d.date}>
              <rect
                x={x}
                y={barHeight === 0 ? y - 1 : y}
                width={barWidth}
                height={barHeight === 0 ? 1 : barHeight}
                rx={Math.min(4, barWidth / 2)}
                fill="var(--viz-series-1)"
                opacity={isHovered ? 1 : 0.85}
              />
              <rect
                x={x - GAP / 2}
                y={PADDING_TOP}
                width={barWidth + GAP}
                height={plotHeight}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            </g>
          );
        })}

        {data.map((d, i) => {
          if (i % 5 !== 0 && i !== data.length - 1) return null;
          const x = PADDING_LEFT + i * (barWidth + GAP) + barWidth / 2;
          const label = new Date(d.date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });
          return (
            <text key={d.date} x={x} y={HEIGHT - 8} textAnchor="middle" fontSize={10} fill="var(--viz-text-muted)">
              {label}
            </text>
          );
        })}
      </svg>

      {hovered && hoverIndex !== null && (
        <div
          className="pointer-events-none absolute rounded-md border px-2 py-1 text-xs shadow-sm"
          style={{
            borderColor: "var(--viz-grid)",
            background: "var(--viz-surface)",
            color: "var(--viz-text-primary)",
            left: `${((hoverIndex + 0.5) * (barWidth + GAP) + PADDING_LEFT) / WIDTH * 100}%`,
            top: 8,
            transform: "translateX(-50%)",
          }}
        >
          <div style={{ color: "var(--viz-text-secondary)" }}>
            {new Date(hovered.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </div>
          <div className="font-medium tabular-nums">{hovered.tokens.toLocaleString()} tokens</div>
        </div>
      )}
    </div>
  );
}
