-- Migration 010: Add property_types array to projects
-- Stores which property types exist in a project so the external lead form
-- can filter the options shown to partner realtors.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS property_types text[] NOT NULL DEFAULT '{}';

-- Index for any future filtering
CREATE INDEX IF NOT EXISTS idx_projects_property_types ON projects USING GIN (property_types);
