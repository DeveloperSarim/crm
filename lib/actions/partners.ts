'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

/** Toggle a partner's is_active flag. Head-only. */
export async function togglePartnerActive(partnerId: string, isActive: boolean) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'head') return { error: 'Forbidden' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', partnerId)
    .eq('role', 'external') // safety: only external profiles

  if (error) return { error: error.message }
  revalidatePath('/partners')
  return { ok: true }
}

/** Update a partner's profile details (name, email, phone, company). Head-only. */
export async function updatePartner(partnerId: string, data: {
  full_name: string
  email: string
  phone: string
  company_name: string
}) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return { error: 'Unauthorized' }

  const { data: callerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((callerProfile as any)?.role !== 'head') return { error: 'Forbidden' }

  const admin = createAdminClient()

  // Update email in auth.users if changed
  const { data: targetProfile } = await admin.from('profiles').select('email').eq('id', partnerId).single()
  if (data.email && data.email !== (targetProfile as any)?.email) {
    const { error: emailErr } = await admin.auth.admin.updateUserById(partnerId, { email: data.email })
    if (emailErr) return { error: emailErr.message }
  }

  // Update profile table
  const { error } = await admin
    .from('profiles')
    .update({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      company_name: data.company_name || null,
    })
    .eq('id', partnerId)
    .eq('role', 'external')

  if (error) return { error: error.message }
  revalidatePath('/partners')
  return { ok: true }
}

/** Toggle a team member's is_active flag. Head-only. */
export async function toggleMemberActive(memberId: string, isActive: boolean) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return { error: 'Unauthorized' }

  const { data: callerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((callerProfile as any)?.role !== 'head') return { error: 'Forbidden' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', memberId)
    .in('role', ['head', 'sales_member'])

  if (error) return { error: error.message }
  revalidatePath('/team')
  return { ok: true }
}

/** Update a team member's profile details. Head-only. */
export async function updateMember(memberId: string, data: {
  full_name: string
  email: string
  phone: string
  role: 'head' | 'sales_member'
}) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return { error: 'Unauthorized' }

  const { data: callerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((callerProfile as any)?.role !== 'head') return { error: 'Forbidden' }

  const admin = createAdminClient()

  // Update email in auth.users if changed
  const { data: targetProfile } = await admin.from('profiles').select('email').eq('id', memberId).single()
  if (data.email && data.email !== (targetProfile as any)?.email) {
    const { error: emailErr } = await admin.auth.admin.updateUserById(memberId, { email: data.email })
    if (emailErr) return { error: emailErr.message }
  }

  // Update profile table
  const { error } = await admin
    .from('profiles')
    .update({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      role: data.role,
    })
    .eq('id', memberId)
    .in('role', ['head', 'sales_member'])

  if (error) return { error: error.message }
  revalidatePath('/team')
  return { ok: true }
}
