'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addLeadNote(
  leadId: string,
  projectSlug: string,
  content: string,
): Promise<{ ok?: boolean; error?: string }> {
  if (!content?.trim()) return { error: 'Note cannot be empty' }

  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('lead_notes').insert({
    lead_id: leadId,
    author_id: user.id,
    content: content.trim(),
    note_type: 'general',
  })

  if (error) return { error: error.message }

  revalidatePath(`/projects/${projectSlug}/leads/${leadId}`)
  return { ok: true }
}
