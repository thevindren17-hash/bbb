import { DollarSign, FileText, MessageCircleQuestion, MessageCircleX } from "lucide-react";

import { DonutChart } from "@/components/donut-chart";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { createClient } from "@/lib/supabase/server";

const SOURCE_LABELS: Record<string, string> = {
  chat: "Chat replies",
  embedding_query: "Question search",
  embedding_upload: "Document uploads",
};

const GENERATED_BY_LABELS: Record<string, string> = {
  llm: "Answered (AI)",
  retrieval: "Answered (verbatim)",
  none: "No match",
};

export default async function OverviewPage() {
  const supabase = await createClient();

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [{ count: documentCount }, { count: questionCount }, { count: unansweredCount }, { data: questionRows }, { data: tokenRows }] =
    await Promise.all([
      supabase.from("documents").select("*", { count: "exact", head: true }),
      supabase.from("questions_log").select("*", { count: "exact", head: true }),
      supabase
        .from("questions_log")
        .select("*", { count: "exact", head: true })
        .eq("generated_by", "none"),
      supabase
        .from("questions_log")
        .select("generated_by")
        .gte("created_at", since.toISOString())
        .returns<{ generated_by: string | null }[]>(),
      supabase
        .from("token_usage")
        .select("source, total_tokens, estimated_cost_usd")
        .gte("created_at", since.toISOString())
        .returns<{ source: string; total_tokens: number; estimated_cost_usd: number }[]>(),
    ]);

  const bySource: Record<string, number> = {};
  let monthCost = 0;
  for (const row of tokenRows ?? []) {
    bySource[row.source] = (bySource[row.source] ?? 0) + row.total_tokens;
    monthCost += row.estimated_cost_usd;
  }

  const byAnswerSource: Record<string, number> = {};
  for (const row of questionRows ?? []) {
    const key = row.generated_by ?? "none";
    byAnswerSource[key] = (byAnswerSource[key] ?? 0) + 1;
  }

  const tokenSourceData = ["chat", "embedding_query", "embedding_upload"].map((key) => ({
    label: SOURCE_LABELS[key],
    value: bySource[key] ?? 0,
  }));

  const answerSourceData = ["llm", "retrieval", "none"].map((key) => ({
    label: GENERATED_BY_LABELS[key],
    value: byAnswerSource[key] ?? 0,
  }));

  return (
    <div className="space-y-8">
      <PageHeader title="Overview" description="Where things stand across the bot and the knowledge base." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Documents" value={documentCount ?? 0} icon={FileText} />
        <StatCard label="Questions asked" value={questionCount ?? 0} icon={MessageCircleQuestion} />
        <StatCard label="Unanswered" value={unansweredCount ?? 0} icon={MessageCircleX} />
        <StatCard label="Est. cost (30d)" value={`$${monthCost.toFixed(4)}`} icon={DollarSign} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-medium text-foreground-muted">
            Token usage by source (last 30 days)
          </h2>
          <DonutChart data={tokenSourceData} />
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-medium text-foreground-muted">
            Answer source (last 30 days)
          </h2>
          <DonutChart data={answerSourceData} />
        </div>
      </div>
    </div>
  );
}
