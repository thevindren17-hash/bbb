-- SMG HR Assistant: editable settings (system prompt, etc.)

create table if not exists settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table settings enable row level security;

create policy "Authenticated users can manage settings"
  on settings for all
  to authenticated
  using (true)
  with check (true);

insert into settings (key, value) values (
  'system_prompt',
  'You are an HR assistant for {company}. Answer the staff member''s question using ONLY the context clauses provided below. If the context does not contain enough information to answer, say so and suggest contacting HR directly - do not make anything up. Always cite the source document/clause for each fact you state. Reply in the same language as the question.'
) on conflict (key) do nothing;
