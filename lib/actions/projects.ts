'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { slugify } from '@/lib/utils/formatters'

/**
 * Toggle a project pin for the current user.
 * Returns { pinned: boolean } to indicate the new state.
 */
export async function togglePinProject(
  projectId: string
): Promise<{ pinned: boolean } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check if already pinned
  const { data: existing } = await supabase
    .from('user_pinned_projects')
    .select('project_id')
    .eq('user_id', user.id)
    .eq('project_id', projectId)
    .maybeSingle()

  if (existing) {
    // Unpin
    await supabase
      .from('user_pinned_projects')
      .delete()
      .eq('user_id', user.id)
      .eq('project_id', projectId)
    revalidatePath('/', 'layout')
    return { pinned: false }
  }

  // Enforce max 6 pins
  const { count } = await supabase
    .from('user_pinned_projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) >= 6) {
    return { error: 'Maximum 6 pinned projects allowed. Unpin one first.' }
  }

  await supabase
    .from('user_pinned_projects')
    .insert({ user_id: user.id, project_id: projectId })

  revalidatePath('/', 'layout')
  return { pinned: true }
}

export async function createProject(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'head') redirect('/projects')

  const name = formData.get('name') as string
  const slug = slugify(name)

  const amenitiesRaw = formData.get('amenities') as string
  const amenities = amenitiesRaw ? amenitiesRaw.split(',').map((a: string) => a.trim()).filter(Boolean) : []

  const pricingMin = formData.get('pricing_min') as string
  const pricingMax = formData.get('pricing_max') as string
  const pricingDetails = pricingMin ? [{ price: `SAR ${pricingMin}${pricingMax ? ` – SAR ${pricingMax}` : ''}` }] : []

  const propertyTypes = formData.getAll('property_types') as string[]

  await supabase.from('projects').insert({
    name,
    slug,
    description: (formData.get('description') as string) || null,
    location: (formData.get('location') as string) || null,
    city: (formData.get('city') as string) || null,
    status: (formData.get('status') as any) || 'active',
    rera_number: (formData.get('rera_number') as string) || null,
    total_units: formData.get('total_units') ? Number(formData.get('total_units')) : null,
    amenities,
    pricing_details: pricingDetails,
    property_types: propertyTypes,
    color_hue: Math.floor(Math.random() * 360),
    is_published: formData.get('is_published') === 'true',
    created_by: user.id,
  })

  revalidatePath('/projects')
  redirect(`/projects/${slug}`)
}

export async function updateProject(slug: string, formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'head') redirect(`/projects/${slug}`)

  const amenitiesRaw = formData.get('amenities') as string
  const amenities = amenitiesRaw ? amenitiesRaw.split(',').map((a: string) => a.trim()).filter(Boolean) : []

  const pricingMin = formData.get('pricing_min') as string
  const pricingMax = formData.get('pricing_max') as string
  const pricingDetails = pricingMin ? [{ price: `SAR ${pricingMin}${pricingMax ? ` – SAR ${pricingMax}` : ''}` }] : []

  const propertyTypes = formData.getAll('property_types') as string[]

  await supabase.from('projects').update({
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || null,
    location: (formData.get('location') as string) || null,
    city: (formData.get('city') as string) || null,
    status: (formData.get('status') as any),
    rera_number: (formData.get('rera_number') as string) || null,
    total_units: formData.get('total_units') ? Number(formData.get('total_units')) : null,
    amenities,
    pricing_details: pricingDetails,
    property_types: propertyTypes,
    is_published: formData.get('is_published') === 'true',
  }).eq('slug', slug)

  revalidatePath(`/projects/${slug}`)
  revalidatePath('/projects')
  redirect(`/projects/${slug}`)
}

// ── Quick-update project status from the detail page ─────────────────────────
export async function updateProjectStatus(
  slug: string,
  status: string,
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'head') return { error: 'Only heads can change project status' }

  const { error } = await supabase.from('projects').update({ status }).eq('slug', slug)
  if (error) return { error: error.message }

  revalidatePath(`/projects/${slug}`)
  revalidatePath('/projects')
  return { ok: true }
}

// ── Update project cover image URL ───────────────────────────────────────────
export async function updateProjectCoverImage(
  slug: string,
  coverImageUrl: string,
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'head') return { error: 'Only heads can update project images' }

  const { error } = await supabase
    .from('projects')
    .update({ cover_image_url: coverImageUrl })
    .eq('slug', slug)

  if (error) return { error: error.message }

  revalidatePath(`/projects/${slug}`)
  revalidatePath('/projects')
  return { ok: true }
}
