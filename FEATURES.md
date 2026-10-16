# SMG HR Assistant — Feature Roadmap & Build Spec

A living spec for the SMG HR Assistant system. Use this as the execution checklist in VS Code.

---

## Current State (built)

- `bot.py` — Telegram bot, polling-based
- `retrieval.py` — keyword-based retrieval over static docs (demo-grade, $0 cost)
- `jd_generator.py` — template-based job ad + interview question generator
- `sample_docs.py` — dummy Employment Act + sample company policy clauses (EN/BM)

**Limitation:** docs are hardcoded in a Python file. No admin upload. No real LLM — answers are retrieved verbatim, not generated/synthesized.

---

## Architecture (target)

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Admin Dashboard │─────▶│  Document         │─────▶│  Supabase        │
│  (Next.js/Vercel)│ upload│  Processor        │ embed│  (pgvector +     │
│  HR uploads docs │      │  (chunk + embed)  │      │   storage)       │
└─────────────────┘      └──────────────────┘      └────────┬────────┘
                                                              │ retrieve
┌─────────────────┐      ┌──────────────────┐      ┌────────▼────────┐
│  Telegram Bot    │◀─────│  LLM Layer        │◀─────│  Vector Search   │
│  (staff ask Qs)  │ reply│  (GPT-5.4 nano)   │ context│  (top-k chunks)│
└─────────────────┘      └──────────────────┘      └─────────────────┘
        │
        ▼
┌─────────────────┐
│  WhatsApp Bot    │  (Feature #8 — same backend, second channel)
└─────────────────┘
```

---

## Tier 1 — Core upgrade from demo (do these first)

- [ ] **Admin dashboard** — Next.js app on Vercel, Supabase Auth login for HR admin
- [ ] **Document upload** — PDF/DOCX upload → text extraction (e.g. `pdf-parse`, `mammoth`)
- [ ] **Chunking + embeddings** — split docs into ~300-500 token chunks, embed via OpenAI `text-embedding-3-small`, store in Supabase pgvector
- [ ] **Document management UI** — list uploaded docs, delete/replace, see last-updated date
- [ ] **Swap retrieval.py** — replace keyword matching with real vector search (query embedding → cosine similarity search in Supabase)
- [ ] **Swap in GPT-5.4 nano** — LLM generates the answer from retrieved chunks instead of returning them verbatim; must be instructed to answer ONLY from provided context and cite the source doc/clause
- [ ] **Analytics view in dashboard** — questions asked, unanswered questions (doc gaps), usage over time

## Tier 2 — Requested next: Features #8 and #9

### Feature #8 — WhatsApp as a second channel

**Goal:** Same backend (retrieval + LLM), two front doors — Telegram and WhatsApp — so staff can use whichever they already have.

- [ ] Register with Meta WhatsApp Business API (or use a provider like Twilio/360dialog to simplify onboarding)
- [ ] Build a shared `answer_engine.py` module — the retrieval + LLM logic, channel-agnostic (both `bot.py` and the WhatsApp handler call into this, instead of duplicating logic)
- [ ] Build `whatsapp_bot.py` — webhook receiver for incoming WhatsApp messages, calls `answer_engine.py`, sends reply via WhatsApp Cloud API
- [ ] Handle session/auth differences — WhatsApp requires a verified business number and template message approval for proactive messages (not an issue for reactive Q&A, only matters if you later add push notifications)
- [ ] Add channel tag to analytics (so the dashboard shows "X questions via Telegram, Y via WhatsApp")

**Cost note:** WhatsApp Business API has a free tier for user-initiated conversations (the relevant case here — staff messaging in first), then per-conversation pricing beyond that. Check current Meta rates before quoting, as these change.

### Feature #9 — Feedback loop (👍/👎 on answers)

**Goal:** Let staff flag bad answers, so HR/you can see which docs are unclear, ambiguous, or missing — turns the bot into a self-improving system and gives you a concrete quality metric for your pitch.

- [ ] Add inline buttons to each bot reply — Telegram supports `InlineKeyboardButton` (👍 / 👎) natively
- [ ] On tap, log: question text, matched document chunk(s), answer given, thumbs up/down, timestamp, language
- [ ] Store in a new Supabase table, e.g. `feedback_log`
- [ ] Dashboard view: "Lowest-rated answers this week" — surfaces exactly which policy docs need clarifying or which questions the retrieval is matching poorly
- [ ] Optional: on 👎, auto-prompt "Would you like to rephrase, or should I escalate this to HR?"

---

## Tier 3 — Later / only after trust is built

- [ ] Voice channel (tie in multilingual ElevenLabs voice agent — EN/BM/Tamil/Mandarin)
- [ ] Authenticated self-service tied to individual leave balances (needs HRIS integration — higher compliance burden, needs DPIA)
- [ ] JD generator auto-posting to job boards (LinkedIn/JobStreet API)
- [ ] Interview scheduling automation

---

## Cost summary (at SMG scale, ~1,000 staff, moderate usage)

| Item | Est. monthly cost |
|---|---|
| Hosting (Vercel + Supabase) | $0 (free tier) to ~$20 |
| Embeddings (doc updates only, infrequent) | Pennies |
| GPT-5.4 nano (Q&A generation, ~500-5,000 questions/mo) | ~$0.20–2.00 |
| WhatsApp Business API (if added) | Free tier for user-initiated convos, then per-conversation — check current Meta rates |
| **Total infra** | **Under RM40/month even generously estimated** |

Pricing to SMG (your fee) is separate from infra cost — see pitch conversation for retainer/setup fee structuring logic.

---

## Build order recommendation

1. `answer_engine.py` (shared logic) — do this now, before WhatsApp, so Telegram bot refactors into using it too (avoids duplicating retrieval/LLM code later)
2. Admin dashboard + document upload + real vector search
3. Swap in GPT-5.4 nano generation
4. Feedback loop (#9) — quick win, high signal value, builds on existing Telegram bot
5. WhatsApp channel (#8) — bigger lift (Meta approval process), do after the core is proven
