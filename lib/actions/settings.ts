'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// ── Save notification preferences ────────────────────────────────────────────
export async function saveNotificationPrefs(prefs: Record<string, boolean>) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return { error: 'Unauthorized' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ notification_prefs: prefs })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { ok: true }
}

// ── Save integration config ───────────────────────────────────────────────────
export async function saveIntegration(
  name: string,
  config: Record<string, string>,
  isEnabled: boolean,
) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return { error: 'Unauthorized' }

  // Verify head role
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'head') return { error: 'Only heads can manage integrations' }

  // Upsert by name
  const { error } = await admin
    .from('workspace_integrations')
    .upsert(
      { name, config, is_enabled: isEnabled, created_by: user.id, updated_at: new Date().toISOString() },
      { onConflict: 'name' },
    )

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { ok: true }
}

// ── Load integrations (returns all rows) ──────────────────────────────────────
export async function loadIntegrations() {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return { data: [] }

  const { data } = await supabase.from('workspace_integrations').select('*')
  return { data: data ?? [] }
}
