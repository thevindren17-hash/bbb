"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function updateSystemPrompt(formData: FormData) {
  const value = String(formData.get("system_prompt") ?? "").trim();
  if (!value) throw new Error("System prompt cannot be empty.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .upsert(
      { key: "system_prompt", value, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}
