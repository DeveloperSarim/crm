-- ============================================================
-- user_pinned_projects — lets each user pin up to 6 projects
-- in their sidebar for quick access
-- ============================================================

create table if not exists public.user_pinned_projects (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  pinned_at  timestamptz not null default now(),
  primary key (user_id, project_id)
);

-- Index for fast per-user look-ups
create index if not exists user_pinned_projects_user_idx
  on public.user_pinned_projects (user_id, pinned_at);

-- RLS: users can only read/write their own pins
alter table public.user_pinned_projects enable row level security;

create policy "Users can read their own pins"
  on public.user_pinned_projects for select
  using (auth.uid() = user_id);

create policy "Users can insert their own pins"
  on public.user_pinned_projects for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own pins"
  on public.user_pinned_projects for delete
  using (auth.uid() = user_id);
