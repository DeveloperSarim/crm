import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { createClient } from './server'
import { createAdminClient } from './admin'

/**
 * React cache() deduplicates within a single render cycle.
 * Auth must always be fresh per-request — do NOT use unstable_cache here
 * because we need the live session cookie.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

/**
 * getUserProfile — cross-request cache (60s TTL).
 *
 * Uses createAdminClient() inside the unstable_cache callback because
 * unstable_cache forbids dynamic data sources like cookies().
 * The service-role client needs only the static env vars — no cookies.
 * Auth is already verified before this function is ever called.
 */
const _fetchProfile = unstable_cache(
  async (userId: string) => {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return data
  },
  ['user-profile'],
  { revalidate: 60, tags: ['user-profile'] }
)

export const getUserProfile = cache(async (userId: string) => {
  return _fetchProfile(userId)
})

/**
 * getSidebarData — badge counts + pinned projects, cached 30s per user.
 *
 * Same pattern: admin client inside unstable_cache to avoid cookies() error.
 */
const _fetchSidebarData = unstable_cache(
  async (userId: string, role: string) => {
    const supabase = createAdminClient()

    const [
      { count: projectCount },
      { count: leadCount },
      { data: pinnedRows },
    ] = await Promise.all([
      supabase
        .from('projects')
        .select('*', { count: 'exact', head: true }),
      role === 'head'
        ? supabase.from('leads').select('*', { count: 'exact', head: true })
        : supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', userId),
      supabase
        .from('user_pinned_projects')
        .select('project:projects(id, slug, name, color_hue)')
        .eq('user_id', userId)
        .order('pinned_at', { ascending: true })
        .limit(6),
    ])

    const pinnedProjects = (pinnedRows ?? [])
      .map((r: any) => r.project)
      .filter(Boolean) as { id: string; slug: string; name: string; color_hue: number }[]

    return {
      projectCount: projectCount ?? 0,
      leadCount: leadCount ?? 0,
      pinnedProjects,
    }
  },
  ['sidebar-data'],
  { revalidate: 30, tags: ['sidebar-data'] }
)

export const getSidebarData = cache(async (userId: string, role: string) => {
  return _fetchSidebarData(userId, role)
})
