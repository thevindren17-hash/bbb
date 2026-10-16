-- SMG HR Assistant: core schema (Tier 1)
-- Run this against the Supabase project once it exists (SQL editor, or
-- `supabase db push` if you adopt the Supabase CLI).

create extension if not exists vector;
create extension if not exists pgcrypto;

-- Documents uploaded via the admin dashboard.
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  filename text not null,
  lang text not null default 'en',
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Chunked + embedded text, used for vector search by the bot.
-- Embedding dimension (1536) matches OpenAI text-embedding-3-small.
create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create index if not exists document_chunks_embedding_idx
  on document_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Similarity search RPC used by the bot's retrieval layer.
create or replace function match_document_chunks (
  query_embedding vector(1536),
  match_count int default 3
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  source text,
  similarity float
)
language sql stable
as $$
  select
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    documents.title as source,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  join documents on documents.id = document_chunks.document_id
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
$$;

-- Questions asked to the bot (any channel), for the dashboard analytics view.
create table if not exists questions_log (
  id uuid primary key default gen_random_uuid(),
  channel text not null default 'telegram',
  question text not null,
  answer text,
  matched_sources text[],
  generated_by text,
  lang text,
  created_at timestamptz not null default now()
);

-- RLS: HR admins (authenticated via the dashboard) can manage documents.
-- The bot talks to Supabase with the service role key, which bypasses RLS,
-- so it can read documents/chunks and write questions_log without a policy.
alter table documents enable row level security;
alter table document_chunks enable row level security;
alter table questions_log enable row level security;

create policy "Authenticated users can manage documents"
  on documents for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can manage document_chunks"
  on document_chunks for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can read questions_log"
  on questions_log for select
  to authenticated
  using (true);
