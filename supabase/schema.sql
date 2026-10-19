-- ============================================================================
--  StudySpark AI — database schema
--  Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
--  It is safe to run more than once.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
--  Table: notes
--  Stores every saved summary and question set, linked to the student account.
-- ----------------------------------------------------------------------------
create table if not exists public.notes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  title        text not null,
  content_type text not null check (content_type in ('summary', 'questions')),
  source_text  text default '',
  content      text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists notes_user_updated_idx
  on public.notes (user_id, updated_at desc);

-- ----------------------------------------------------------------------------
--  Row Level Security
--  Students can only ever see and change their own rows.
-- ----------------------------------------------------------------------------
alter table public.notes enable row level security;

drop policy if exists "Students can view own notes" on public.notes;
create policy "Students can view own notes"
  on public.notes for select
  using (auth.uid() = user_id);

drop policy if exists "Students can insert own notes" on public.notes;
create policy "Students can insert own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

drop policy if exists "Students can update own notes" on public.notes;
create policy "Students can update own notes"
  on public.notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Students can delete own notes" on public.notes;
create policy "Students can delete own notes"
  on public.notes for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
--  Keep updated_at current automatically on every update.
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
  before update on public.notes
  for each row
  execute function public.set_updated_at();
