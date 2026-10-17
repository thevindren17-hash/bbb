import { NextResponse } from "next/server";

import { chunkText } from "@/lib/chunk";
import { EMBEDDING_MODEL, embedTexts } from "@/lib/embeddings";
import { extractText } from "@/lib/extract";
import { createClient } from "@/lib/supabase/server";
import { logTokenUsage } from "@/lib/tokenTracking";

// Vercel caps serverless function request bodies at 4.5 MB (platform limit,
// not configurable). Stay under it so uploads fail with a clear message
// instead of a 413 from the platform.
const MAX_FILE_BYTES = 4 * 1024 * 1024;

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

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max is 4 MB.` },
      { status: 413 }
    );
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
    const { embeddings, promptTokens } = await embedTexts(chunks);
    const rows = chunks.map((content, i) => ({
      document_id: document.id,
      chunk_index: i,
      content,
      embedding: embeddings[i],
    }));

    const { error: chunkError } = await supabase.from("document_chunks").insert(rows);
    if (chunkError) throw new Error(chunkError.message);

    await logTokenUsage(supabase, "embedding_upload", EMBEDDING_MODEL, promptTokens);
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
