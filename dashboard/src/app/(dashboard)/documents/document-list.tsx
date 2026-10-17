"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deleteDocument } from "./actions";

type DocRow = {
  id: string;
  title: string;
  filename: string;
  lang: string;
  created_at: string;
  chunk_count: number;
};

export function DocumentList({ documents }: { documents: DocRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this document and its indexed chunks?")) return;
    setPendingId(id);
    try {
      await deleteDocument(id);
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-5 py-8 text-center text-sm text-foreground-muted">
        No documents uploaded yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-surface-muted text-foreground-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">File</th>
            <th className="px-4 py-3 font-medium">Lang</th>
            <th className="px-4 py-3 font-medium">Chunks</th>
            <th className="px-4 py-3 font-medium">Uploaded</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-medium">{doc.title}</td>
              <td className="px-4 py-3 text-foreground-muted">{doc.filename}</td>
              <td className="px-4 py-3 uppercase text-foreground-muted">{doc.lang}</td>
              <td className="px-4 py-3 tabular-nums text-foreground-muted">{doc.chunk_count}</td>
              <td className="px-4 py-3 text-foreground-muted">
                {new Date(doc.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={pendingId === doc.id}
                  className="inline-flex items-center gap-1.5 text-red-600 hover:underline disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  {pendingId === doc.id ? "Deleting..." : "Delete"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
