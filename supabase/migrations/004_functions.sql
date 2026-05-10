-- ============================================================
-- Rayash CRM — Database Functions & Triggers
-- ============================================================

-- ─────────────────────────────────────────────
-- Notify head when external lead is submitted
-- ─────────────────────────────────────────────
create or replace function public.notify_head_on_external_lead()
returns trigger language plpgsql security definer as $$
declare
  head_id uuid;
  project_name text;
begin
  if new.is_external_lead = true then
    -- Get project name
    select name into project_name from public.projects where id = new.project_id;

    -- Notify all head users
    for head_id in
      select id from public.profiles where role = 'head' and is_active = true
    loop
      insert into public.notifications (recipient_id, type, title, body, lead_id)
      values (
        head_id,
        'new_external_lead',
        'New external lead submitted',
        format('Lead for %s from realtor portal — %s', project_name, new.full_name),
        new.id
      );
    end loop;

    -- Auto-create commission record
    insert into public.commission_records (lead_id, realtor_id, project_id, status)
    values (new.id, new.external_realtor_id, new.project_id, 'pending');
  end if;
  return new;
end; $$;

create trigger on_external_lead_submitted
  after insert on public.leads
  for each row execute function public.notify_head_on_external_lead();

-- ─────────────────────────────────────────────
-- Notify sales member when lead is assigned
-- ─────────────────────────────────────────────
create or replace function public.notify_on_lead_assignment()
returns trigger language plpgsql security definer as $$
declare
  project_name text;
begin
  -- Only fire when assigned_to changes to a new value
  if new.assigned_to is not null and (old.assigned_to is null or old.assigned_to <> new.assigned_to) then
    select name into project_name from public.projects where id = new.project_id;

    insert into public.notifications (recipient_id, type, title, body, lead_id)
    values (
      new.assigned_to,
      'lead_assigned',
      'New lead assigned to you',
      format('%s — %s', project_name, new.full_name),
      new.id
    );
  end if;
  return new;
end; $$;

create trigger on_lead_assigned
  after update on public.leads
  for each row execute function public.notify_on_lead_assignment();

-- ─────────────────────────────────────────────
-- Get dashboard stats for head
-- ─────────────────────────────────────────────
create or replace function public.get_dashboard_stats()
returns json language sql security definer stable as $$
  select json_build_object(
    'total_leads', (select count(*) from public.leads),
    'active_projects', (select count(*) from public.projects where status in ('active', 'presale')),
    'closed_won', (select count(*) from public.leads where status = 'closed_won'),
    'closed_lost', (select count(*) from public.leads where status = 'closed_lost'),
    'new_leads_today', (
      select count(*) from public.leads
      where created_at >= current_date
    ),
    'new_leads_this_week', (
      select count(*) from public.leads
      where created_at >= date_trunc('week', current_date)
    ),
    'external_leads', (select count(*) from public.leads where is_external_lead = true),
    'pending_follow_ups', (
      select count(*) from public.leads
      where follow_up_date <= current_date and status not in ('closed_won', 'closed_lost')
    )
  );
$$;

-- ─────────────────────────────────────────────
-- Get stats for a specific project
-- ─────────────────────────────────────────────
create or replace function public.get_project_stats(p_project_id uuid)
returns json language sql security definer stable as $$
  select json_build_object(
    'total_leads', (select count(*) from public.leads where project_id = p_project_id),
    'new', (select count(*) from public.leads where project_id = p_project_id and status = 'new'),
    'interested', (select count(*) from public.leads where project_id = p_project_id and status = 'interested'),
    'site_visit', (select count(*) from public.leads where project_id = p_project_id and status = 'site_visit'),
    'closed_won', (select count(*) from public.leads where project_id = p_project_id and status = 'closed_won'),
    'closed_lost', (select count(*) from public.leads where project_id = p_project_id and status = 'closed_lost'),
    'conversion_rate', (
      case when (select count(*) from public.leads where project_id = p_project_id) = 0 then 0
      else round(
        100.0 * (select count(*) from public.leads where project_id = p_project_id and status = 'closed_won')
        / (select count(*) from public.leads where project_id = p_project_id),
        1
      ) end
    )
  );
$$;

-- ─────────────────────────────────────────────
-- Bulk assign leads
-- ─────────────────────────────────────────────
create or replace function public.bulk_assign_leads(
  p_lead_ids uuid[],
  p_assignee_id uuid
)
returns integer language plpgsql security definer as $$
declare
  updated_count integer;
begin
  -- Only head can bulk assign
  if not public.is_head() then
    raise exception 'Only head can assign leads';
  end if;

  update public.leads
  set assigned_to = p_assignee_id
  where id = any(p_lead_ids);

  get diagnostics updated_count = row_count;
  return updated_count;
end; $$;

-- ─────────────────────────────────────────────
-- Distribute leads evenly across team members
-- ─────────────────────────────────────────────
create or replace function public.distribute_leads(
  p_lead_ids uuid[],
  p_assignee_ids uuid[]
)
returns integer language plpgsql security definer as $$
declare
  i integer := 0;
  lead_id uuid;
  updated_count integer := 0;
begin
  if not public.is_head() then
    raise exception 'Only head can distribute leads';
  end if;

  foreach lead_id in array p_lead_ids loop
    update public.leads
    set assigned_to = p_assignee_ids[(i % array_length(p_assignee_ids, 1)) + 1]
    where id = lead_id;
    i := i + 1;
    updated_count := updated_count + 1;
  end loop;

  return updated_count;
end; $$;
