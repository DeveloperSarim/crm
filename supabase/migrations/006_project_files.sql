-- ── Project files table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_files (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name          text NOT NULL,          -- sanitised storage filename
  original_name text NOT NULL,          -- original filename from user
  mime_type     text NOT NULL DEFAULT '',
  size_bytes    bigint NOT NULL DEFAULT 0,
  storage_path  text NOT NULL,          -- path inside the bucket
  public_url    text,                   -- cached public URL (if bucket is public)
  ai_summary    text,                   -- Claude-generated summary (nullable)
  is_public     boolean NOT NULL DEFAULT false,
  uploaded_by   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  uploaded_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files (project_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view files for any project
CREATE POLICY "auth users can view project files"
  ON project_files FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert their own files
CREATE POLICY "auth users can insert project files"
  ON project_files FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- Uploader or head can delete
CREATE POLICY "uploader or head can delete project files"
  ON project_files FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'head'
    )
  );

-- ── Supabase Storage bucket (run this in Dashboard → Storage → New bucket) ───
-- Bucket name : project-files
-- Public      : false  (use signed URLs)
-- File size   : 50 MB
-- Allowed MIME: */*
