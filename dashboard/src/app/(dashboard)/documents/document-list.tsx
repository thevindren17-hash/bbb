"use client";

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
    return <p className="text-sm text-zinc-500">No documents uploaded yet.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b border-black/10 text-zinc-500 dark:border-white/15">
        <tr>
          <th className="py-2 font-medium">Title</th>
          <th className="py-2 font-medium">File</th>
          <th className="py-2 font-medium">Lang</th>
          <th className="py-2 font-medium">Chunks</th>
          <th className="py-2 font-medium">Uploaded</th>
          <th className="py-2 font-medium"></th>
        </tr>
      </thead>
      <tbody>
        {documents.map((doc) => (
          <tr key={doc.id} className="border-b border-black/5 dark:border-white/10">
            <td className="py-2">{doc.title}</td>
            <td className="py-2 text-zinc-500">{doc.filename}</td>
            <td className="py-2 uppercase text-zinc-500">{doc.lang}</td>
            <td className="py-2 text-zinc-500">{doc.chunk_count}</td>
            <td className="py-2 text-zinc-500">
              {new Date(doc.created_at).toLocaleDateString()}
            </td>
            <td className="py-2 text-right">
              <button
                onClick={() => handleDelete(doc.id)}
                disabled={pendingId === doc.id}
                className="text-red-600 hover:underline disabled:opacity-50"
              >
                {pendingId === doc.id ? "Deleting..." : "Delete"}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
