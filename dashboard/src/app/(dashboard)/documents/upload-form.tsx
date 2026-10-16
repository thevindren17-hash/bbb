"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function UploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("uploading");
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/documents/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Upload failed." }));
      setStatus("error");
      setErrorMessage(body.error ?? "Upload failed.");
      return;
    }

    setStatus("idle");
    formRef.current?.reset();
    router.refresh();
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-black/10 p-4 dark:border-white/15"
    >
      <div className="space-y-1">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          placeholder="e.g. Leave Policy 2026"
          className="w-56 rounded border border-black/15 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="lang" className="text-sm font-medium">
          Language
        </label>
        <select
          id="lang"
          name="lang"
          defaultValue="en"
          className="rounded border border-black/15 px-3 py-2 text-sm dark:border-white/20 dark:bg-transparent"
        >
          <option value="en">English</option>
          <option value="bm">Bahasa Melayu</option>
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="file" className="text-sm font-medium">
          File (PDF, DOCX, TXT, MD)
        </label>
        <input
          id="file"
          name="file"
          type="file"
          required
          accept=".pdf,.docx,.txt,.md"
          className="w-64 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={status === "uploading"}
        className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {status === "uploading" ? "Uploading..." : "Upload"}
      </button>

      {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}
    </form>
  );
}
