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
        className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-accent"
      />
      <p className="text-xs text-foreground-muted">
        Use <code className="rounded bg-surface-muted px-1">{"{company}"}</code> anywhere you want
        the company name inserted. Takes effect on the bot&apos;s next reply - no redeploy needed.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {status === "saving" ? "Saving..." : "Save"}
        </button>
        {status === "saved" && <span className="text-sm text-green-600">Saved.</span>}
        {status === "error" && <span className="text-sm text-red-600">{errorMessage}</span>}
      </div>
    </form>
  );
}
