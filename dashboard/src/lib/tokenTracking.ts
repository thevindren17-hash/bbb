import type { SupabaseClient } from "@supabase/supabase-js";

// USD per 1M tokens. Mirrors token_tracking.py's PRICING table - keep both
// in sync when switching models.
const PRICING: Record<string, { prompt: number; completion: number }> = {
  "gpt-4o-mini": { prompt: 0.15, completion: 0.6 },
  "gpt-5.4-nano": { prompt: 0.2, completion: 1.25 },
  "text-embedding-3-small": { prompt: 0.02, completion: 0 },
};

function estimateCost(model: string, promptTokens: number, completionTokens: number) {
  const rates = PRICING[model];
  if (!rates) return 0;
  return (promptTokens / 1_000_000) * rates.prompt + (completionTokens / 1_000_000) * rates.completion;
}

export async function logTokenUsage(
  supabase: SupabaseClient,
  source: "chat" | "embedding_query" | "embedding_upload",
  model: string,
  promptTokens: number,
  completionTokens = 0
) {
  try {
    await supabase.from("token_usage").insert({
      source,
      model,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
      estimated_cost_usd: estimateCost(model, promptTokens, completionTokens),
    });
  } catch {
    // Best-effort - never break the caller over a logging failure.
  }
}
