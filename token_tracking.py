"""Logs OpenAI token usage to Supabase so the dashboard's Usage page can show
daily/weekly/monthly consumption and estimated cost. Best-effort - a logging
failure never breaks the caller.
"""

import logging

from supabase_client import get_client

logger = logging.getLogger(__name__)

# USD per 1M tokens. Add a model here when you switch models, otherwise its
# cost shows as $0 (tokens still get counted).
PRICING = {
    "gpt-4o-mini": {"prompt": 0.15, "completion": 0.60},
    "gpt-5.4-nano": {"prompt": 0.20, "completion": 1.25},
    "text-embedding-3-small": {"prompt": 0.02, "completion": 0.0},
}


def _estimate_cost(model, prompt_tokens, completion_tokens):
    rates = PRICING.get(model)
    if not rates:
        return 0.0
    return (prompt_tokens / 1_000_000) * rates["prompt"] + (
        completion_tokens / 1_000_000
    ) * rates["completion"]


def log_usage(source, model, prompt_tokens, completion_tokens=0):
    supabase = get_client()
    if supabase is None:
        return
    try:
        total_tokens = prompt_tokens + completion_tokens
        supabase.table("token_usage").insert(
            {
                "source": source,
                "model": model,
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": total_tokens,
                "estimated_cost_usd": _estimate_cost(model, prompt_tokens, completion_tokens),
            }
        ).execute()
    except Exception:
        logger.exception("Failed to log token usage to Supabase.")
