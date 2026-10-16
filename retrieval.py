"""Keyword-based retrieval over static docs (demo-grade, $0 cost)."""

import re

from sample_docs import DOCS

_STOPWORDS = {
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "to", "of",
    "in", "on", "for", "and", "or", "what", "how", "do", "does", "i", "my",
    "can", "will", "yang", "dan", "atau", "adalah", "untuk", "saya", "ke",
}


def _tokenize(text):
    tokens = re.findall(r"[a-zA-Z']+", text.lower())
    return {t for t in tokens if t not in _STOPWORDS}


def search(query, top_k=3):
    """Return up to top_k docs ranked by keyword overlap with the query."""
    query_tokens = _tokenize(query)
    if not query_tokens:
        return []

    scored = []
    for doc in DOCS:
        doc_tokens = _tokenize(doc["text"] + " " + doc["source"])
        overlap = query_tokens & doc_tokens
        if overlap:
            scored.append((len(overlap), doc))

    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [doc for _, doc in scored[:top_k]]


def answer(query, top_k=3):
    """Return matching docs for a query, or None if nothing matched."""
    matches = search(query, top_k=top_k)
    return matches or None
