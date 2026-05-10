'use server'

import { createClient } from '@/lib/supabase/server'

export interface SearchResult {
  id: string
  type: 'project' | 'lead'
  title: string
  subtitle: string
  href: string
}

export async function searchWorkspace(query: string): Promise<{ results: SearchResult[]; error?: string }> {
  if (!query || query.trim().length < 1) return { results: [] }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { results: [], error: 'Unauthorized' }

  const q = query.trim()

  const [projectsRes, leadsRes] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, slug, location, status')
      .or(`name.ilike.%${q}%,location.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('leads')
      .select('id, full_name, phone, email, status, project_id, projects!inner(slug)')
      .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const results: SearchResult[] = []

  for (const p of (projectsRes.data ?? [])) {
    results.push({
      id: p.id,
      type: 'project',
      title: p.name,
      subtitle: [p.location, p.status?.replace('_', ' ')].filter(Boolean).join(' · '),
      href: `/projects/${p.slug}`,
    })
  }

  for (const l of (leadsRes.data ?? [])) {
    const projectSlug = (l as any).projects?.slug
    results.push({
      id: l.id,
      type: 'lead',
      title: l.full_name,
      subtitle: [l.phone ?? l.email, l.status?.replace('_', ' ')].filter(Boolean).join(' · '),
      href: projectSlug ? `/projects/${projectSlug}/leads/${l.id}` : `/leads`,
    })
  }

  return { results }
}
