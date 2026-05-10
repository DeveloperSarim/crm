-- ============================================================
-- Rayash CRM — Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_media enable row level security;
alter table public.lead_sources enable row level security;
alter table public.leads enable row level security;
alter table public.lead_notes enable row level security;
alter table public.lead_status_history enable row level security;
alter table public.notifications enable row level security;
alter table public.commission_records enable row level security;

-- Helper: get current user role
create or replace function public.current_user_role()
returns text language sql security definer stable as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Helper: is head
create or replace function public.is_head()
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'head');
$$;

-- ─────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────
-- Everyone can view profiles (needed to show team member names)
create policy "profiles: authenticated users can view all"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can update their own profile
create policy "profiles: users can update own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

-- Head can insert new profiles (when inviting members)
create policy "profiles: head can insert"
  on public.profiles for insert
  to authenticated
  with check (public.is_head());

-- Head can update any profile (for role changes, deactivation)
create policy "profiles: head can update any"
  on public.profiles for update
  to authenticated
  using (public.is_head());

-- ─────────────────────────────────────────────
-- projects
-- ─────────────────────────────────────────────
-- All authenticated users can view published projects
create policy "projects: authenticated can view published"
  on public.projects for select
  to authenticated
  using (is_published = true or public.is_head());

-- Only head can insert/update/delete projects
create policy "projects: head can insert"
  on public.projects for insert
  to authenticated
  with check (public.is_head());

create policy "projects: head can update"
  on public.projects for update
  to authenticated
  using (public.is_head());

create policy "projects: head can delete"
  on public.projects for delete
  to authenticated
  using (public.is_head());

-- ─────────────────────────────────────────────
-- project_media
-- ─────────────────────────────────────────────
create policy "project_media: all authenticated can view"
  on public.project_media for select
  to authenticated
  using (true);

create policy "project_media: head can insert"
  on public.project_media for insert
  to authenticated
  with check (public.is_head());

create policy "project_media: head can update"
  on public.project_media for update
  to authenticated
  using (public.is_head());

create policy "project_media: head can delete"
  on public.project_media for delete
  to authenticated
  using (public.is_head());

-- ─────────────────────────────────────────────
-- lead_sources (reference data — everyone reads)
-- ─────────────────────────────────────────────
create policy "lead_sources: all authenticated can view"
  on public.lead_sources for select
  to authenticated
  using (true);

create policy "lead_sources: head can manage"
  on public.lead_sources for all
  to authenticated
  using (public.is_head())
  with check (public.is_head());

-- ─────────────────────────────────────────────
-- leads (most restrictive table)
-- ─────────────────────────────────────────────

-- HEAD: full access
create policy "leads: head full access"
  on public.leads for all
  to authenticated
  using (public.is_head())
  with check (public.is_head());

-- SALES MEMBER: only see assigned leads
create policy "leads: sales member sees own assigned"
  on public.leads for select
  to authenticated
  using (
    public.current_user_role() = 'sales_member'
    and assigned_to = auth.uid()
  );

-- SALES MEMBER: can update their own assigned leads (status, notes, follow-up)
create policy "leads: sales member can update assigned"
  on public.leads for update
  to authenticated
  using (
    public.current_user_role() = 'sales_member'
    and assigned_to = auth.uid()
  );

-- SALES MEMBER: can insert leads (manual add)
create policy "leads: sales member can insert"
  on public.leads for insert
  to authenticated
  with check (
    public.current_user_role() in ('sales_member', 'head')
  );

-- EXTERNAL: can insert leads (submissions)
create policy "leads: external can submit"
  on public.leads for insert
  to authenticated
  with check (
    public.current_user_role() = 'external'
    and is_external_lead = true
    and external_realtor_id = auth.uid()
  );

-- EXTERNAL: can view only their own submitted leads
create policy "leads: external sees own submissions"
  on public.leads for select
  to authenticated
  using (
    public.current_user_role() = 'external'
    and external_realtor_id = auth.uid()
  );

-- ─────────────────────────────────────────────
-- lead_notes
-- ─────────────────────────────────────────────
-- Head sees all notes
create policy "lead_notes: head sees all"
  on public.lead_notes for all
  to authenticated
  using (public.is_head())
  with check (public.is_head());

-- Sales member sees notes on their assigned leads
create policy "lead_notes: sales member sees own leads notes"
  on public.lead_notes for select
  to authenticated
  using (
    public.current_user_role() = 'sales_member'
    and exists (
      select 1 from public.leads
      where leads.id = lead_notes.lead_id
      and leads.assigned_to = auth.uid()
    )
  );

-- Sales member can add notes to their leads
create policy "lead_notes: sales member can insert on assigned"
  on public.lead_notes for insert
  to authenticated
  with check (
    public.current_user_role() = 'sales_member'
    and author_id = auth.uid()
    and exists (
      select 1 from public.leads
      where leads.id = lead_notes.lead_id
      and leads.assigned_to = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- lead_status_history
-- ─────────────────────────────────────────────
create policy "lead_status_history: head sees all"
  on public.lead_status_history for select
  to authenticated
  using (public.is_head());

create policy "lead_status_history: sales member sees own"
  on public.lead_status_history for select
  to authenticated
  using (
    public.current_user_role() = 'sales_member'
    and exists (
      select 1 from public.leads
      where leads.id = lead_status_history.lead_id
      and leads.assigned_to = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- notifications
-- ─────────────────────────────────────────────
-- Users can only see/update their own notifications
create policy "notifications: users see own"
  on public.notifications for select
  to authenticated
  using (recipient_id = auth.uid());

create policy "notifications: users can mark read"
  on public.notifications for update
  to authenticated
  using (recipient_id = auth.uid());

-- System (service_role) inserts notifications — so no INSERT policy for users
-- Head can insert notifications
create policy "notifications: head can insert"
  on public.notifications for insert
  to authenticated
  with check (public.is_head());

-- ─────────────────────────────────────────────
-- commission_records
-- ─────────────────────────────────────────────
-- Head: full access
create policy "commission: head full access"
  on public.commission_records for all
  to authenticated
  using (public.is_head())
  with check (public.is_head());

-- External: see own commissions
create policy "commission: external sees own"
  on public.commission_records for select
  to authenticated
  using (
    public.current_user_role() = 'external'
    and realtor_id = auth.uid()
  );
