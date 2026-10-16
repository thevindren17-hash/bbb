"""One-time/occasional bootstrap: embeds sample_docs.py into Supabase so the
bot's vector search has something to retrieve before any real HR policy
documents are uploaded via the admin dashboard. Safe to re-run - skips docs
that already exist (matched by title).
"""

import os

from dotenv import load_dotenv

load_dotenv()

from openai import OpenAI

from sample_docs import DOCS
from supabase_client import get_client

EMBEDDING_MODEL = "text-embedding-3-small"


def main():
    supabase = get_client()
    if supabase is None:
        raise RuntimeError("Supabase not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).")

    openai_client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    existing = supabase.table("documents").select("title").execute()
    existing_titles = {row["title"] for row in existing.data}

    inserted = 0
    for doc in DOCS:
        if doc["source"] in existing_titles:
            print(f"skip (already seeded): {doc['source']}")
            continue

        embedding = (
            openai_client.embeddings.create(model=EMBEDDING_MODEL, input=[doc["text"]])
            .data[0]
            .embedding
        )

        document = (
            supabase.table("documents")
            .insert({"title": doc["source"], "filename": f"{doc['id']}.txt", "lang": doc["lang"]})
            .execute()
        )
        document_id = document.data[0]["id"]

        supabase.table("document_chunks").insert(
            {
                "document_id": document_id,
                "chunk_index": 0,
                "content": doc["text"],
                "embedding": embedding,
            }
        ).execute()

        print(f"seeded: {doc['source']}")
        inserted += 1

    print(f"\nDone. Inserted {inserted} new document(s).")


if __name__ == "__main__":
    main()
