import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface px-5 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm text-foreground-muted">{label}</div>
        {Icon && (
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-soft text-accent">
            <Icon size={14} />
          </span>
        )}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {sublabel && <div className="mt-0.5 text-sm tabular-nums text-foreground-muted">{sublabel}</div>}
    </div>
  );
}
