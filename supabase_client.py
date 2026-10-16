"""Shared Supabase service-role client, used for vector search and question
logging. Every caller treats a missing/failed client as "not configured"
and falls back to local, $0-cost behavior - none of this is required to run
the bot.
"""

import logging
import os

logger = logging.getLogger(__name__)

_client = None
_attempted = False


def get_client():
    global _client, _attempted
    if _attempted:
        return _client
    _attempted = True

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        return None

    try:
        from supabase import create_client

        _client = create_client(url, key)
    except ImportError:
        logger.warning("supabase package not installed; Supabase features disabled.")
    except Exception:
        logger.exception("Failed to create Supabase client; Supabase features disabled.")

    return _client
