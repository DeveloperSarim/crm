-- ============================================================
-- Rayash CRM — Initial Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
-- profiles (extends auth.users)
-- ─────────────────────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  email         text not null unique,
  phone         text,
  role          text not null check (role in ('head', 'sales_member', 'external')) default 'sales_member',
  company_name  text,          -- used for external realtors/companies
  is_active     boolean not null default true,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'sales_member')
  );
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────
-- projects
-- ─────────────────────────────────────────────
create table public.projects (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  description      text,
  location         text,
  city             text,
  status           text not null check (status in ('active', 'presale', 'paused', 'completed', 'archived')) default 'active',
  pricing_details  jsonb default '[]'::jsonb,  -- [{ "label": "3BHK", "price": "₹3.6 Cr" }]
  amenities        text[] default '{}',
  rera_number      text,
  total_units      integer,
  is_published     boolean not null default true,  -- visible to external portal
  cover_image_url  text,
  color_hue        integer default 210,  -- for placeholder images
  created_by       uuid references public.profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────
-- project_media
-- ─────────────────────────────────────────────
create table public.project_media (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects(id) on delete cascade,
  type           text not null check (type in ('image', 'video', 'brochure')),
  url            text not null,
  display_order  integer not null default 0,
  is_cover       boolean not null default false,
  uploaded_by    uuid references public.profiles(id),
  uploaded_at    timestamptz not null default now()
);

-- Only one cover per project
create unique index project_media_cover_idx
  on public.project_media (project_id)
  where is_cover = true;

-- ─────────────────────────────────────────────
-- lead_sources (reference table, seeded)
-- ─────────────────────────────────────────────
create table public.lead_sources (
  id        uuid primary key default gen_random_uuid(),
  name      text not null unique,
  type      text not null check (type in ('digital', 'offline', 'external', 'import', 'crm')),
  is_active boolean not null default true
);

-- ─────────────────────────────────────────────
-- leads (core table)
-- ─────────────────────────────────────────────
create table public.leads (
  id                   uuid primary key default gen_random_uuid(),
  reference_id         text unique,        -- e.g. RYS-LD-24871 (auto-generated)
  project_id           uuid not null references public.projects(id) on delete restrict,
  -- client info
  full_name            text not null,
  phone                text not null,
  email                text,
  address              text,
  query                text,               -- client's requirement notes
  -- property interest
  intent               text check (intent in ('buy', 'rent')) default 'buy',
  property_type        text check (property_type in ('apartment', 'villa', 'building', 'land', 'office', 'commercial', 'retail', 'warehouse')),
  budget_min           numeric(14,2),
  budget_max           numeric(14,2),
  budget_display       text,              -- "₹3.6 Cr" or "₹1.4 L/mo"
  timeline             text,             -- "0-3 months", "3-6 months", etc.
  -- lead management
  lead_source_id       uuid references public.lead_sources(id),
  assigned_to          uuid references public.profiles(id),
  submitted_by         uuid references public.profiles(id),
  external_realtor_id  uuid references public.profiles(id),  -- set when lead from external
  is_external_lead     boolean not null default false,
  -- status & follow-up
  status               text not null check (status in ('new', 'contacted', 'interested', 'site_visit', 'negotiation', 'closed_won', 'closed_lost', 'on_hold')) default 'new',
  score                integer check (score >= 0 and score <= 100),
  follow_up_date       date,
  follow_up_notes      text,
  -- commission
  commission_status    text check (commission_status in ('na', 'pending', 'approved', 'paid')) default 'na',
  commission_amount    numeric(12,2),
  -- lock for external leads
  lock_expires_at      timestamptz,
  -- metadata
  import_batch_id      uuid,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- Auto-generate reference_id
create or replace function public.generate_lead_reference()
returns trigger language plpgsql as $$
declare
  seq integer;
begin
  select coalesce(max(cast(regexp_replace(reference_id, '[^0-9]', '', 'g') as integer)), 24000) + 1
  into seq from public.leads where reference_id is not null;
  new.reference_id = 'RYS-LD-' || lpad(seq::text, 5, '0');
  -- Set lock for external leads (30 days)
  if new.is_external_lead then
    new.lock_expires_at = now() + interval '30 days';
  end if;
  return new;
end; $$;

create trigger leads_reference_id
  before insert on public.leads
  for each row execute function public.generate_lead_reference();

-- Indexes
create index leads_project_id_idx on public.leads (project_id);
create index leads_assigned_to_idx on public.leads (assigned_to);
create index leads_external_realtor_idx on public.leads (external_realtor_id);
create index leads_status_idx on public.leads (status);
create index leads_created_at_idx on public.leads (created_at desc);

-- ─────────────────────────────────────────────
-- lead_notes
-- ─────────────────────────────────────────────
create table public.lead_notes (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  author_id   uuid not null references public.profiles(id),
  content     text not null,
  note_type   text not null check (note_type in ('general', 'call', 'meeting', 'follow_up', 'status_change')) default 'general',
  created_at  timestamptz not null default now()
);

create index lead_notes_lead_id_idx on public.lead_notes (lead_id);

-- ─────────────────────────────────────────────
-- lead_status_history (immutable audit trail)
-- ─────────────────────────────────────────────
create table public.lead_status_history (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid not null references public.leads(id) on delete cascade,
  changed_by   uuid not null references public.profiles(id),
  old_status   text,
  new_status   text not null,
  changed_at   timestamptz not null default now()
);

create index lead_status_history_lead_id_idx on public.lead_status_history (lead_id);

-- Auto-log status changes
create or replace function public.log_lead_status_change()
returns trigger language plpgsql security definer as $$
begin
  if old.status is distinct from new.status then
    insert into public.lead_status_history (lead_id, changed_by, old_status, new_status)
    values (new.id, auth.uid(), old.status, new.status);
  end if;
  return new;
end; $$;

create trigger leads_status_history
  after update on public.leads
  for each row execute function public.log_lead_status_change();

-- ─────────────────────────────────────────────
-- notifications
-- ─────────────────────────────────────────────
create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references public.profiles(id) on delete cascade,
  type          text not null check (type in ('new_external_lead', 'lead_assigned', 'follow_up_due', 'commission_update')),
  title         text not null,
  body          text,
  lead_id       uuid references public.leads(id) on delete set null,
  is_read       boolean not null default false,
  created_at    timestamptz not null default now()
);

create index notifications_recipient_idx on public.notifications (recipient_id, is_read, created_at desc);

-- ─────────────────────────────────────────────
-- commission_records
-- ─────────────────────────────────────────────
create table public.commission_records (
  id                uuid primary key default gen_random_uuid(),
  lead_id           uuid not null unique references public.leads(id),
  realtor_id        uuid not null references public.profiles(id),
  project_id        uuid not null references public.projects(id),
  deal_value        numeric(14,2),
  commission_rate   numeric(5,2) default 1.25,  -- percentage
  commission_amount numeric(12,2),
  status            text not null check (status in ('pending', 'approved', 'paid')) default 'pending',
  approved_by       uuid references public.profiles(id),
  approved_at       timestamptz,
  paid_at           timestamptz,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger commission_records_updated_at
  before update on public.commission_records
  for each row execute function public.set_updated_at();
