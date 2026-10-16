"""Shared retrieval + LLM answer logic, channel-agnostic.

Both bot.py (Telegram) and whatsapp_bot.py (future) call into this instead
of duplicating retrieval/LLM code. Retrieval prefers Supabase vector search
over the documents uploaded via the admin dashboard, falling back to local
keyword search over sample_docs.py if Supabase/OpenAI aren't configured.
Answer generation falls back the same way: LLM synthesis if OPENAI_API_KEY
is set, else verbatim retrieval ($0 cost) - the bot works at every tier.
"""

import logging
import os

import vector_retrieval
from retrieval import search as keyword_search
from supabase_client import get_client

logger = logging.getLogger(__name__)

OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

SYSTEM_PROMPT = (
    "You are an HR assistant for {company}. Answer the staff member's question "
    "using ONLY the context clauses provided below. If the context does not "
    "contain enough information to answer, say so and suggest contacting HR "
    "directly - do not make anything up. Always cite the source document/clause "
    "for each fact you state. Reply in the same language as the question."
)


def _format_context(docs):
    return "\n\n".join(f"[{doc['source']}]\n{doc['text']}" for doc in docs)


def _llm_synthesize(query, docs, company):
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return None

    try:
        from openai import OpenAI
    except ImportError:
        logger.warning("openai package not installed; falling back to verbatim retrieval.")
        return None

    try:
        client = OpenAI(api_key=api_key)
        context = _format_context(docs)
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT.format(company=company)},
                {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {query}"},
            ],
            temperature=0.2,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        logger.exception("LLM synthesis failed; falling back to verbatim retrieval.")
        return None


def _retrieve(query, top_k):
    docs = vector_retrieval.search(query, top_k=top_k)
    if docs is not None:
        return docs
    return keyword_search(query, top_k=top_k)


def _log_question(channel, query, result, lang):
    supabase = get_client()
    if supabase is None:
        return
    try:
        supabase.table("questions_log").insert(
            {
                "channel": channel,
                "question": query,
                "answer": result["answer"],
                "matched_sources": result["sources"],
                "generated_by": result["generated_by"],
                "lang": lang,
            }
        ).execute()
    except Exception:
        logger.exception("Failed to log question to Supabase.")


def get_answer(query, company="the company", top_k=3, channel="telegram", lang=None):
    """Return {"answer": str, "sources": [str], "generated_by": "llm"|"retrieval"|"none"}."""
    docs = _retrieve(query, top_k=top_k)
    if not docs:
        result = {
            "answer": "Sorry, I couldn't find anything relevant. Try rephrasing, or contact HR directly.",
            "sources": [],
            "generated_by": "none",
        }
    else:
        llm_answer = _llm_synthesize(query, docs, company)
        if llm_answer:
            result = {
                "answer": llm_answer,
                "sources": [d["source"] for d in docs],
                "generated_by": "llm",
            }
        else:
            verbatim = "\n\n---\n\n".join(f"\U0001F4C4 {d['source']}\n{d['text']}" for d in docs)
            result = {
                "answer": verbatim,
                "sources": [d["source"] for d in docs],
                "generated_by": "retrieval",
            }

    _log_question(channel, query, result, lang)
    return result
