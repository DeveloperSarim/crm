-- ============================================================
-- Migration 009: Performance Indexes
-- Run this in Supabase SQL Editor to speed up common queries
-- NOTE: CONCURRENTLY removed — Supabase SQL Editor runs inside
--       a transaction block which forbids CONCURRENTLY.
-- ============================================================

-- leads table — most frequently filtered columns
CREATE INDEX IF NOT EXISTS idx_leads_project_id
  ON leads(project_id);

CREATE INDEX IF NOT EXISTS idx_leads_assigned_to
  ON leads(assigned_to);

CREATE INDEX IF NOT EXISTS idx_leads_status
  ON leads(status);

-- Most list views order by created_at DESC
CREATE INDEX IF NOT EXISTS idx_leads_created_at_desc
  ON leads(created_at DESC);

-- Composite: "leads for project X, ordered by date"
CREATE INDEX IF NOT EXISTS idx_leads_project_id_created_at
  ON leads(project_id, created_at DESC);

-- Composite: "leads assigned to user Y, ordered by date"
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to_created_at
  ON leads(assigned_to, created_at DESC);

-- lead_notes table
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id
  ON lead_notes(lead_id);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id_created_at
  ON lead_notes(lead_id, created_at DESC);

-- lead_status_history table
CREATE INDEX IF NOT EXISTS idx_lead_status_history_lead_id
  ON lead_status_history(lead_id);

CREATE INDEX IF NOT EXISTS idx_lead_status_history_lead_id_changed_at
  ON lead_status_history(lead_id, changed_at DESC);

-- project_files table
CREATE INDEX IF NOT EXISTS idx_project_files_project_id
  ON project_files(project_id);

CREATE INDEX IF NOT EXISTS idx_project_files_project_id_created_at
  ON project_files(project_id, created_at DESC);

-- user_pinned_projects table
CREATE INDEX IF NOT EXISTS idx_user_pinned_projects_user_id
  ON user_pinned_projects(user_id);

CREATE INDEX IF NOT EXISTS idx_user_pinned_projects_user_id_pinned_at
  ON user_pinned_projects(user_id, pinned_at ASC);

-- projects table — slug lookups are the hottest path in the app
CREATE INDEX IF NOT EXISTS idx_projects_slug
  ON projects(slug);

CREATE INDEX IF NOT EXISTS idx_projects_is_published
  ON projects(is_published) WHERE is_published = true;

-- profiles table — role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON profiles(role);

CREATE INDEX IF NOT EXISTS idx_profiles_role_is_active
  ON profiles(role, is_active) WHERE is_active = true;
