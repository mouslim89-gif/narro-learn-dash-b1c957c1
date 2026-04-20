create table public.sentence_translations (
  id uuid primary key default gen_random_uuid(),
  hash text not null unique,
  japanese text not null,
  english text not null,
  created_at timestamptz not null default now()
);
alter table public.sentence_translations enable row level security;
create policy "Anyone can read sentence translations"
  on public.sentence_translations for select using (true);
create index sentence_translations_hash_idx on public.sentence_translations (hash);