import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";

import { PromptForm } from "./prompt-form";

const DEFAULT_SYSTEM_PROMPT =
  "You are an HR assistant for {company}. Answer the staff member's question " +
  "using ONLY the context clauses provided below. If the context does not " +
  "contain enough information to answer, say so and suggest contacting HR " +
  "directly - do not make anything up. Always cite the source document/clause " +
  "for each fact you state. Reply in the same language as the question.";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "system_prompt")
    .maybeSingle();

  const currentPrompt = data?.value ?? DEFAULT_SYSTEM_PROMPT;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Controls how the bot answers questions on every channel (Telegram, and WhatsApp once added)."
      />

      <div className="max-w-2xl space-y-3 rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-medium">System prompt</h2>
        <PromptForm initialValue={currentPrompt} />
      </div>
    </div>
  );
}
