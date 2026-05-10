'use server'

import { createClient } from '@/lib/supabase/server'

export interface ExportLead {
  reference_id: string | null
  full_name: string
  phone: string
  email: string | null
  address: string | null
  status: string
  intent: string | null
  property_type: string | null
  budget_display: string | null
  query: string | null
  source: string | null
  assigned_to: string | null
  follow_up_date: string | null
  follow_up_notes: string | null
  score: number | null
  created_at: string
  updated_at: string
}

export async function getLeadsForExport(projectSlug?: string): Promise<{ data?: ExportLead[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return { error: 'Unauthorized' }

  let query = supabase
    .from('leads')
    .select(`
      reference_id, full_name, phone, email, address,
      status, intent, property_type, budget_display, query,
      score, follow_up_date, follow_up_notes, created_at, updated_at,
      source:lead_sources(name),
      assigned:profiles!leads_assigned_to_fkey(full_name),
      project:projects!inner(slug)
    `)
    .order('created_at', { ascending: false })

  if (projectSlug) {
    query = query.eq('project.slug', projectSlug)
  }

  const { data, error } = await query

  if (error) return { error: error.message }

  const leads: ExportLead[] = (data ?? []).map((l: any) => ({
    reference_id: l.reference_id,
    full_name: l.full_name,
    phone: l.phone,
    email: l.email,
    address: l.address,
    status: l.status?.replace(/_/g, ' ') ?? '',
    intent: l.intent,
    property_type: l.property_type?.replace(/_/g, ' ') ?? null,
    budget_display: l.budget_display,
    query: l.query,
    source: Array.isArray(l.source) ? l.source[0]?.name : l.source?.name ?? null,
    assigned_to: Array.isArray(l.assigned) ? l.assigned[0]?.full_name : l.assigned?.full_name ?? null,
    follow_up_date: l.follow_up_date,
    follow_up_notes: l.follow_up_notes,
    score: l.score,
    created_at: l.created_at,
    updated_at: l.updated_at,
  }))

  return { data: leads }
}
