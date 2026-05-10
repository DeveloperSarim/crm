'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function submitExternalLead(formData: FormData): Promise<void> {
  // 1. Verify the caller is an authenticated external user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/partner/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'external') redirect('/portal')

  const projectId = formData.get('project_id') as string
  const projectSlug = formData.get('project_slug') as string

  if (!projectId) redirect('/portal')

  // 2. Use admin client for the insert — RLS blocks external users from inserting leads
  const admin = createAdminClient()

  // Look up realtor lead source
  const { data: source } = await admin
    .from('lead_sources')
    .select('id')
    .ilike('name', '%realtor%')
    .limit(1)
    .maybeSingle()

  const { error } = await admin.from('leads').insert({
    project_id: projectId,
    full_name: formData.get('full_name') as string,
    phone: formData.get('phone') as string,
    email: (formData.get('email') as string) || null,
    query: (formData.get('query') as string) || null,
    intent: (formData.get('intent') as any) || null,
    property_type: (formData.get('property_type') as string) || null,
    budget_display: (formData.get('budget_display') as string) || null,
    lead_source_id: (source as any)?.id ?? null,
    external_realtor_id: user.id,
    submitted_by: user.id,
    is_external_lead: true,
    status: 'new',
  })

  // If insert fails, redirect back to the form with an error param
  if (error) {
    const backUrl = projectSlug ? `/portal/${projectSlug}/submit-lead?error=1` : '/portal?error=1'
    redirect(backUrl)
  }

  revalidatePath('/my-leads')
  revalidatePath(`/portal/${projectSlug}`)
  redirect('/my-leads?submitted=1')
}
