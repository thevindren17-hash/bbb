import { NextResponse } from "next/server";

import { chunkText } from "@/lib/chunk";
import { embedTexts } from "@/lib/embeddings";
import { extractText } from "@/lib/extract";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const title = String(formData.get("title") ?? "");
  const lang = String(formData.get("lang") ?? "en");

  if (!(file instanceof File) || !title) {
    return NextResponse.json({ error: "Missing file or title." }, { status: 400 });
  }

  let text: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    text = await extractText(file.name, buffer);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to read file." },
      { status: 400 }
    );
  }

  const chunks = chunkText(text);
  if (chunks.length === 0) {
    return NextResponse.json({ error: "No extractable text found in file." }, { status: 400 });
  }

  const { data: document, error: docError } = await supabase
    .from("documents")
    .insert({ title, filename: file.name, lang, uploaded_by: userData.user.id })
    .select("id")
    .single();

  if (docError || !document) {
    return NextResponse.json(
      { error: docError?.message ?? "Failed to save document." },
      { status: 500 }
    );
  }

  try {
    const embeddings = await embedTexts(chunks);
    const rows = chunks.map((content, i) => ({
      document_id: document.id,
      chunk_index: i,
      content,
      embedding: embeddings[i],
    }));

    const { error: chunkError } = await supabase.from("document_chunks").insert(rows);
    if (chunkError) throw new Error(chunkError.message);
  } catch (err) {
    // Roll back the document row so we don't leave an unembedded, unsearchable entry.
    await supabase.from("documents").delete().eq("id", document.id);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to embed document." },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: document.id, chunks: chunks.length });
}
