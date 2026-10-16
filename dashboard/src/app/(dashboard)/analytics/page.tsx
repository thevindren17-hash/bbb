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
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Analytics</h1>

      <div className="flex gap-4">
        <StatCard label="Questions asked" value={totalCount ?? 0} />
        <StatCard label="Unanswered (doc gaps)" value={unansweredCount ?? 0} />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-zinc-500">Recent questions</h2>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 text-zinc-500 dark:border-white/15">
            <tr>
              <th className="py-2 font-medium">Question</th>
              <th className="py-2 font-medium">Channel</th>
              <th className="py-2 font-medium">Source</th>
              <th className="py-2 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-black/5 dark:border-white/10">
                <td className="py-2">{row.question}</td>
                <td className="py-2 text-zinc-500">{row.channel}</td>
                <td className="py-2 text-zinc-500">
                  {row.generated_by === "none" ? (
                    <span className="text-red-600">no match</span>
                  ) : (
                    row.generated_by
                  )}
                </td>
                <td className="py-2 text-zinc-500">{new Date(row.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-zinc-500">
                  No questions logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-black/10 px-4 py-3 dark:border-white/15">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-zinc-500">{label}</div>
    </div>
  );
}
