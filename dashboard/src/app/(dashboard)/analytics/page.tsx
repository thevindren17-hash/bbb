import { MessageCircleQuestion, MessageCircleX } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { createClient } from "@/lib/supabase/server";

type LogRow = {
  question: string;
  channel: string;
  generated_by: string | null;
  lang: string | null;
  created_at: string;
};

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const [{ count: totalCount }, { count: unansweredCount }, { data: recent }] = await Promise.all([
    supabase.from("questions_log").select("*", { count: "exact", head: true }),
    supabase
      .from("questions_log")
      .select("*", { count: "exact", head: true })
      .eq("generated_by", "none"),
    supabase
      .from("questions_log")
      .select("question, channel, generated_by, lang, created_at")
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<LogRow[]>(),
  ]);

  const rows = recent ?? [];

  return (
    <div className="space-y-8">
      <PageHeader title="Analytics" description="Questions staff have asked the bot, and where it's falling short." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Questions asked" value={totalCount ?? 0} icon={MessageCircleQuestion} />
        <StatCard label="Unanswered (doc gaps)" value={unansweredCount ?? 0} icon={MessageCircleX} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-foreground-muted">Recent questions</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-foreground-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Question</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{row.question}</td>
                  <td className="px-4 py-3 text-foreground-muted">{row.channel}</td>
                  <td className="px-4 py-3 text-foreground-muted">
                    {row.generated_by === "none" ? (
                      <span className="text-red-600">no match</span>
                    ) : (
                      row.generated_by
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground-muted">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-foreground-muted">
                    No questions logged yet.
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
