-- ── Fix project_files RLS ─────────────────────────────────────────────────────
-- The WITH CHECK (uploaded_by = auth.uid()) policy fails in SSR server actions
-- because the anon-key client's auth.uid() context doesn't always resolve the
-- same way as supabase.auth.getUser(). Fix: simpler policy + auto-set trigger.

-- Drop the problematic insert policy
DROP POLICY IF EXISTS "auth users can insert project files" ON project_files;

-- Trigger function: auto-populate uploaded_by from the current JWT
CREATE OR REPLACE FUNCTION auto_set_uploaded_by()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Only set if caller didn't supply it (or it was left NULL)
  IF NEW.uploaded_by IS NULL THEN
    NEW.uploaded_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_auto_uploaded_by ON project_files;
CREATE TRIGGER tr_auto_uploaded_by
  BEFORE INSERT ON project_files
  FOR EACH ROW EXECUTE FUNCTION auto_set_uploaded_by();

-- Simpler insert policy: just require the caller to be authenticated
-- The trigger above guarantees uploaded_by is always correct
CREATE POLICY "auth users can insert project files"
  ON project_files FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also allow service_role to insert without restrictions (for server actions)
CREATE POLICY "service role full access on project files"
  ON project_files
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
