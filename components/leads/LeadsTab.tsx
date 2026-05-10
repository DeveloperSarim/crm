import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/cached'
import { LeadTableClient } from './LeadTableClient'

interface LeadsTabProps {
  projectId: string
  projectSlug: string
  isHead: boolean
  userId: string
}

export async function LeadsTab({ projectId, projectSlug, isHead, userId }: LeadsTabProps) {
  const supabase = await createClient()

  let query = supabase
    .from('leads')
    .select(`
      id, reference_id, full_name, phone, email, status, intent, property_type,
      budget_display, score, follow_up_date, created_at, updated_at,
      source:lead_sources(id, name),
      assigned:profiles!leads_assigned_to_fkey(id, full_name)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (!isHead) query = query.eq('assigned_to', userId)

  const { data: leads } = await query

  // Fetch team members for assignment (head only)
  let teamMembers: { id: string; full_name: string }[] = []
  if (isHead) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'sales_member')
      .eq('is_active', true)
      .order('full_name')
    teamMembers = data ?? []
  }

  return (
    <LeadTableClient
      leads={leads ?? []}
      teamMembers={teamMembers}
      projectSlug={projectSlug}
      isHead={isHead}
    />
  )
}
