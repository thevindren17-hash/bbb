-- SMG HR Assistant: token/cost tracking, for the dashboard Usage page.

create table if not exists token_usage (
  id uuid primary key default gen_random_uuid(),
  source text not null, -- 'chat' | 'embedding_query' | 'embedding_upload'
  model text not null,
  prompt_tokens int not null default 0,
  completion_tokens int not null default 0,
  total_tokens int not null default 0,
  estimated_cost_usd numeric(12, 6) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists token_usage_created_at_idx on token_usage (created_at);

alter table token_usage enable row level security;

create policy "Authenticated users can manage token_usage"
  on token_usage for all
  to authenticated
  using (true)
  with check (true);
