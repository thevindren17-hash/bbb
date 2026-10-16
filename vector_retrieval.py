"""Vector search over Supabase pgvector document_chunks (uploaded via the
admin dashboard). Returns None if Supabase/OpenAI aren't configured or the
search fails, so answer_engine.py can fall back to local keyword retrieval.
"""

import logging
import os

from supabase_client import get_client
from token_tracking import log_usage

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = "text-embedding-3-small"


def _embed_query(query):
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return None

    try:
        from openai import OpenAI
    except ImportError:
        return None

    try:
        client = OpenAI(api_key=api_key)
        response = client.embeddings.create(model=EMBEDDING_MODEL, input=[query])
        if response.usage:
            log_usage("embedding_query", EMBEDDING_MODEL, response.usage.prompt_tokens)
        return response.data[0].embedding
    except Exception:
        logger.exception("Query embedding failed.")
        return None


def search(query, top_k=3):
    """Return [{"source": str, "text": str}] or None if unavailable."""
    supabase = get_client()
    if supabase is None:
        return None

    embedding = _embed_query(query)
    if embedding is None:
        return None

    try:
        response = supabase.rpc(
            "match_document_chunks",
            {"query_embedding": embedding, "match_count": top_k},
        ).execute()
    except Exception:
        logger.exception("Supabase vector search failed.")
        return None

    rows = response.data or []
    if not rows:
        return None
    return [{"source": row["source"], "text": row["content"]} for row in rows]
