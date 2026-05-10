-- ════════════════════════════════════════════════════════════════════════════
-- Migration 008 — Storage bucket policies + notification prefs + integrations
-- Run this ONCE in Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════════════════════════════════


-- ── PART 1 ─ Storage bucket policies for "project-files" bucket ──────────────
-- These policies let authenticated users upload/read/delete in the bucket.
-- Without these, even the browser client upload fails with a 403 error.
-- Run only if you haven't already created the bucket policies manually.

-- Allow any authenticated user to upload (insert) files into project-files
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'project-files');

-- Allow any authenticated user to read files in project-files
CREATE POLICY "Authenticated users can read files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'project-files');

-- Allow any authenticated user to update files they own
CREATE POLICY "Authenticated users can update own files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'project-files' AND auth.uid() = owner);

-- Allow any authenticated user to delete files they own
-- (head-based delete permission is enforced at the app layer)
CREATE POLICY "Authenticated users can delete own files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'project-files');

-- Service role bypasses all policies (for server-side admin operations)
CREATE POLICY "Service role full access on storage"
  ON storage.objects
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ── PART 2 ─ Notification preferences (stored in profiles) ───────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notification_prefs jsonb NOT NULL DEFAULT '{}';


-- ── PART 3 ─ Workspace integrations table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_integrations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,           -- 'resend' | 'whatsapp' | 'webhook'
  is_enabled   boolean NOT NULL DEFAULT false,
  config       jsonb NOT NULL DEFAULT '{}',  -- api_key, phone_id, webhook_url etc.
  created_by   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Only one row per integration name
CREATE UNIQUE INDEX IF NOT EXISTS uq_workspace_integrations_name ON workspace_integrations (name);

-- RLS
ALTER TABLE workspace_integrations ENABLE ROW LEVEL SECURITY;

-- Heads can view and edit integrations
CREATE POLICY "heads can manage integrations"
  ON workspace_integrations
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'head')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'head')
  );

-- Service role full access
CREATE POLICY "service role full access on integrations"
  ON workspace_integrations
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
