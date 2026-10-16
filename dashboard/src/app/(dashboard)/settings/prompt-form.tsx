"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { updateSystemPrompt } from "./actions";

export function PromptForm({ initialValue }: { initialValue: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage("");
    try {
      const formData = new FormData();
      formData.set("system_prompt", value);
      await updateSystemPrompt(formData);
      setStatus("saved");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to save.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setStatus("idle");
        }}
        rows={8}
        className="w-full rounded border border-black/15 px-3 py-2 font-mono text-sm dark:border-white/20 dark:bg-transparent"
      />
      <p className="text-xs text-zinc-500">
        Use <code className="rounded bg-black/[0.06] px-1 dark:bg-white/[0.08]">{"{company}"}</code>{" "}
        anywhere you want the company name inserted. Takes effect on the bot&apos;s next reply -
        no redeploy needed.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {status === "saving" ? "Saving..." : "Save"}
        </button>
        {status === "saved" && <span className="text-sm text-green-600">Saved.</span>}
        {status === "error" && <span className="text-sm text-red-600">{errorMessage}</span>}
      </div>
    </form>
  );
}
