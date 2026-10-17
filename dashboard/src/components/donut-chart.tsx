type Slice = { label: string; value: number };

// Fixed categorical order (dataviz skill: never cycle hues by rank).
const COLORS = ["var(--viz-series-1)", "var(--viz-series-2)", "var(--viz-series-3)"];
const GAP = 3;

export function DonutChart({ data, size = 160 }: { data: Slice[]; size?: number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = size / 2;
  const strokeWidth = size * 0.22;
  const r = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * r;

  let cumulative = 0;

  return (
    <div className="viz-root flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Breakdown chart">
        <g transform={`rotate(-90 ${radius} ${radius})`}>
          <circle cx={radius} cy={radius} r={r} fill="none" stroke="var(--viz-grid)" strokeWidth={strokeWidth} />
          {total > 0 &&
            data.map((d, i) => {
              if (d.value <= 0) return null;
              const fraction = d.value / total;
              const rawLength = fraction * circumference;
              const dashoffset = -cumulative;
              cumulative += rawLength;
              const length = Math.max(rawLength - GAP, 0);
              return (
                <circle
                  key={d.label}
                  cx={radius}
                  cy={radius}
                  r={r}
                  fill="none"
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={dashoffset}
                />
              );
            })}
        </g>
      </svg>

      <ul className="space-y-2 text-sm">
        {data.map((d, i) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          return (
            <li key={d.label} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span style={{ color: "var(--viz-text-primary)" }}>{d.label}</span>
              <span className="tabular-nums" style={{ color: "var(--viz-text-secondary)" }}>
                {pct}%
              </span>
            </li>
          );
        })}
        {total === 0 && <li style={{ color: "var(--viz-text-muted)" }}>No data yet.</li>}
      </ul>
    </div>
  );
}
