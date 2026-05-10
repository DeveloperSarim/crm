import { createClient } from '@/lib/supabase/server'
import { getAuthUser, getUserProfile } from '@/lib/supabase/cached'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { SettingsClient } from '@/components/settings/SettingsClient'
import { revalidatePath } from 'next/cache'

// ── Server action — update profile ───────────────────────────────────────────
async function updateProfile(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const full_name = formData.get('full_name') as string
  const phone = formData.get('phone') as string

  await supabase
    .from('profiles')
    .update({ full_name: full_name.trim(), phone: phone.trim() || null })
    .eq('id', user.id)

  revalidatePath('/settings', 'page')
  revalidatePath('/', 'layout')
}

// ── Page — fetch ALL data at once, no searchParams ───────────────────────────
export default async function SettingsPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const profile = await getUserProfile(user.id)
  if (!profile) redirect('/login')

  const supabase = await createClient()
  const isHead = (profile as any).role === 'head'

  // Fetch all data in parallel — tab switching will be instant with no round-trips
  const [
    projectCountRes,
    leadCountRes,
    memberCountRes,
    membersRes,
    profileRes,
    integrationsRes,
  ] = await Promise.all([
    isHead ? supabase.from('projects').select('*', { count: 'exact', head: true }) : Promise.resolve({ count: null }),
    isHead ? supabase.from('leads').select('*', { count: 'exact', head: true }) : Promise.resolve({ count: null }),
    isHead ? supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['head', 'sales_member']) : Promise.resolve({ count: null }),
    isHead ? supabase.from('profiles').select('*').in('role', ['head', 'sales_member']).order('created_at') : Promise.resolve({ data: [] }),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    isHead ? supabase.from('workspace_integrations').select('name, is_enabled, config') : Promise.resolve({ data: [] }),
  ])

  const settingsData = {
    isHead,
    userId: user.id,
    projectCount: (projectCountRes as any).count ?? null,
    leadCount: (leadCountRes as any).count ?? null,
    memberCount: (memberCountRes as any).count ?? null,
    members: (membersRes as any).data ?? [],
    profile: (profileRes as any).data ?? profile,
    notificationPrefs: ((profileRes as any).data as any)?.notification_prefs ?? {},
    integrations: (integrationsRes as any).data ?? [],
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar crumbs={['Workspace', 'Settings']} />
      <SettingsClient data={settingsData} updateProfile={updateProfile} />
    </div>
  )
}
