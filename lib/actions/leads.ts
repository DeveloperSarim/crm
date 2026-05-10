'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function assignLead(leadId: string, assigneeId: string, projectSlug: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'head') return

  await supabase.from('leads').update({ assigned_to: assigneeId }).eq('id', leadId)
  if (projectSlug) revalidatePath(`/projects/${projectSlug}`)
  revalidatePath('/leads')
}

export async function bulkAssignLeads(leadIds: string[], assigneeId: string, projectSlug?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'head') return

  // Use admin client with .in() — no RPC required
  const admin = createAdminClient()
  await admin.from('leads').update({ assigned_to: assigneeId }).in('id', leadIds)

  if (projectSlug) revalidatePath(`/projects/${projectSlug}`)
  revalidatePath('/leads')
}

export async function bulkDeleteLeads(leadIds: string[], projectSlug?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'head') return { error: 'Forbidden' }

  const admin = createAdminClient()
  const { error } = await admin.from('leads').delete().in('id', leadIds)
  if (error) return { error: error.message }

  if (projectSlug) revalidatePath(`/projects/${projectSlug}`)
  revalidatePath('/leads')
  return { ok: true }
}

export async function updateLeadStatus(leadId: string, status: string, projectSlug?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('leads').update({ status }).eq('id', leadId)
  if (projectSlug) revalidatePath(`/projects/${projectSlug}`)
  revalidatePath('/leads')
}

export async function createLead(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const projectSlug = (formData.get('project_slug') as string) || null
  const projectId = formData.get('project_id') as string

  // If no project_id supplied, bail — shouldn't happen with required field
  if (!projectId) redirect('/leads/new')

  // If project_slug not supplied, look it up from the project
  let slug = projectSlug
  if (!slug) {
    const { data: project } = await supabase
      .from('projects')
      .select('slug')
      .eq('id', projectId)
      .single()
    slug = (project as any)?.slug ?? null
  }

  const followUpDate = (formData.get('follow_up_date') as string) || null

  await supabase.from('leads').insert({
    project_id: projectId,
    full_name: formData.get('full_name') as string,
    phone: formData.get('phone') as string,
    email: (formData.get('email') as string) || null,
    address: (formData.get('address') as string) || null,
    query: (formData.get('query') as string) || null,
    intent: (formData.get('intent') as any) || null,
    property_type: (formData.get('property_type') as any) || null,
    budget_display: (formData.get('budget_display') as string) || null,
    lead_source_id: (formData.get('lead_source_id') as string) || null,
    assigned_to: (formData.get('assigned_to') as string) || null,
    follow_up_date: followUpDate,
    follow_up_notes: (formData.get('follow_up_notes') as string) || null,
    status: 'new',
    submitted_by: user.id,
  })

  if (slug) {
    revalidatePath(`/projects/${slug}`)
    redirect(`/projects/${slug}?tab=leads`)
  } else {
    revalidatePath('/leads')
    redirect('/leads')
  }
}

export async function updateLead(leadId: string, formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const projectSlug = (formData.get('project_slug') as string) || null

  await supabase.from('leads').update({
    full_name: formData.get('full_name') as string,
    phone: formData.get('phone') as string,
    email: (formData.get('email') as string) || null,
    address: (formData.get('address') as string) || null,
    query: (formData.get('query') as string) || null,
    intent: (formData.get('intent') as any) || null,
    property_type: (formData.get('property_type') as any) || null,
    budget_display: (formData.get('budget_display') as string) || null,
    lead_source_id: (formData.get('lead_source_id') as string) || null,
    assigned_to: (formData.get('assigned_to') as string) || null,
    follow_up_date: (formData.get('follow_up_date') as string) || null,
    follow_up_notes: (formData.get('follow_up_notes') as string) || null,
    status: (formData.get('status') as any) || 'new',
  }).eq('id', leadId)

  if (projectSlug) {
    revalidatePath(`/projects/${projectSlug}`)
    redirect(`/projects/${projectSlug}/leads/${leadId}`)
  } else {
    revalidatePath('/leads')
    redirect(`/leads`)
  }
}

export async function deleteLead(leadId: string, projectSlug?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'head') return

  await supabase.from('leads').delete().eq('id', leadId)
  if (projectSlug) revalidatePath(`/projects/${projectSlug}`)
  revalidatePath('/leads')
}

export async function approveCommission(leadId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'head') return

  await supabase.from('leads').update({ commission_status: 'approved' }).eq('id', leadId)
  await supabase.from('commission_records')
    .update({ status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() })
    .eq('lead_id', leadId)

  revalidatePath('/leads')
}

export async function markCommissionPaid(leadId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'head') return

  await supabase.from('leads').update({ commission_status: 'paid' }).eq('id', leadId)
  await supabase.from('commission_records')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('lead_id', leadId)

  revalidatePath('/leads')
}
