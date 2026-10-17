import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";

import { DocumentList } from "./document-list";
import { UploadForm } from "./upload-form";

type DocumentWithCount = {
  id: string;
  title: string;
  filename: string;
  lang: string;
  created_at: string;
  document_chunks: { count: number }[] | null;
};

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, title, filename, lang, created_at, document_chunks(count)")
    .order("created_at", { ascending: false })
    .returns<DocumentWithCount[]>();

  const documents = (data ?? []).map((doc) => ({
    id: doc.id,
    title: doc.title,
    filename: doc.filename,
    lang: doc.lang,
    created_at: doc.created_at,
    chunk_count: doc.document_chunks?.[0]?.count ?? 0,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Upload HR policy documents. They are chunked, embedded, and made searchable by the bot automatically."
      />

      <UploadForm />

      {error && <p className="text-sm text-red-600">{error.message}</p>}
      <DocumentList documents={documents} />
    </div>
  );
}
