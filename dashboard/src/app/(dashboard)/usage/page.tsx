import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { createClient } from "@/lib/supabase/server";

import { UsageChart } from "./usage-chart";

type Row = {
  source: string;
  total_tokens: number;
  estimated_cost_usd: number;
  created_at: string;
};

const SOURCE_LABELS: Record<string, string> = {
  chat: "Chat replies",
  embedding_query: "Question search (embeddings)",
  embedding_upload: "Document uploads (embeddings)",
};

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export default async function UsagePage() {
  const supabase = await createClient();

  const today = startOfDay(new Date());
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);
  const monthStart = new Date(today);
  monthStart.setDate(monthStart.getDate() - 29);

  const { data, error } = await supabase
    .from("token_usage")
    .select("source, total_tokens, estimated_cost_usd, created_at")
    .gte("created_at", monthStart.toISOString())
    .returns<Row[]>();

  const rows = data ?? [];

  let todayTokens = 0;
  let todayCost = 0;
  let weekTokens = 0;
  let weekCost = 0;
  let monthTokens = 0;
  let monthCost = 0;
  const bySource: Record<string, { tokens: number; cost: number }> = {};
  const byDay = new Map<string, number>();

  for (let i = 0; i < 30; i++) {
    const d = new Date(monthStart);
    d.setDate(d.getDate() + i);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }

  for (const row of rows) {
    const createdAt = new Date(row.created_at);
    const dayKey = createdAt.toISOString().slice(0, 10);
    byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + row.total_tokens);

    monthTokens += row.total_tokens;
    monthCost += row.estimated_cost_usd;
    if (createdAt >= weekStart) {
      weekTokens += row.total_tokens;
      weekCost += row.estimated_cost_usd;
    }
    if (createdAt >= today) {
      todayTokens += row.total_tokens;
      todayCost += row.estimated_cost_usd;
    }

    const bucket = bySource[row.source] ?? { tokens: 0, cost: 0 };
    bucket.tokens += row.total_tokens;
    bucket.cost += row.estimated_cost_usd;
    bySource[row.source] = bucket;
  }

  const chartData = Array.from(byDay.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, tokens]) => ({ date, tokens }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Usage"
        description="OpenAI token consumption and estimated cost across every channel."
      />

      {error && <p className="text-sm text-red-600">{error.message}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Today" value={`${todayTokens.toLocaleString()} tok`} sublabel={`$${todayCost.toFixed(4)} est.`} />
        <StatCard label="Last 7 days" value={`${weekTokens.toLocaleString()} tok`} sublabel={`$${weekCost.toFixed(4)} est.`} />
        <StatCard label="Last 30 days" value={`${monthTokens.toLocaleString()} tok`} sublabel={`$${monthCost.toFixed(4)} est.`} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-foreground-muted">Daily tokens (last 30 days)</h2>
        <UsageChart data={chartData} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-foreground-muted">
          Breakdown by source (last 30 days)
        </h2>
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <table className="w-full max-w-xl text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-foreground-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Tokens</th>
                <th className="px-4 py-3 font-medium">Est. cost</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(bySource).map(([source, { tokens, cost }]) => (
                <tr key={source} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{SOURCE_LABELS[source] ?? source}</td>
                  <td className="px-4 py-3 tabular-nums text-foreground-muted">{tokens.toLocaleString()}</td>
                  <td className="px-4 py-3 tabular-nums text-foreground-muted">${cost.toFixed(4)}</td>
                </tr>
              ))}
              {Object.keys(bySource).length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-foreground-muted">
                    No usage recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
