"use client";

import { UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const MAX_FILE_BYTES = 4 * 1024 * 1024;

export function UploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");
    if (file instanceof File && file.size > MAX_FILE_BYTES) {
      setStatus("error");
      setErrorMessage(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max is 4 MB.`);
      return;
    }

    setStatus("uploading");
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
      className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm"
    >
      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          placeholder="e.g. Leave Policy 2026"
          className="w-56 rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="lang" className="text-sm font-medium">
          Language
        </label>
        <select
          id="lang"
          name="lang"
          defaultValue="en"
          className="rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
        >
          <option value="en">English</option>
          <option value="bm">Bahasa Melayu</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="file" className="text-sm font-medium">
          File (PDF, DOCX, TXT, MD &middot; max 4 MB)
        </label>
        <input
          id="file"
          name="file"
          type="file"
          required
          accept=".pdf,.docx,.txt,.md"
          className="w-64 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-surface-muted file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-border"
        />
      </div>

      <button
        type="submit"
        disabled={status === "uploading"}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:opacity-50"
      >
        <UploadCloud size={15} />
        {status === "uploading" ? "Uploading..." : "Upload"}
      </button>

      {status === "error" && <p className="w-full text-sm text-red-600">{errorMessage}</p>}
    </form>
  );
}
