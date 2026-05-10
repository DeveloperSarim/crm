import { redirect } from 'next/navigation'
import { getAuthUser, getUserProfile, getSidebarData } from '@/lib/supabase/cached'
import { Sidebar } from '@/components/layout/Sidebar'
import { UserProvider } from '@/components/layout/UserProvider'

export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const profile = await getUserProfile(user.id)
  if (!profile) redirect('/login')
  if ((profile as any).role === 'external') redirect('/portal')

  // Cached for 30s — no Supabase hit on repeat page loads within the TTL
  const { projectCount, leadCount, pinnedProjects } = await getSidebarData(
    user.id,
    (profile as any).role
  )

  const currentUser = {
    id: user.id,
    role: (profile as any).role,
    full_name: (profile as any).full_name,
  }

  return (
    <UserProvider user={currentUser}>
      <div className="flex h-screen overflow-hidden bg-white font-sans text-content">
        <Sidebar
          profile={profile as any}
          projectCount={projectCount}
          leadCount={leadCount}
          pinnedProjects={pinnedProjects}
        />
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </UserProvider>
  )
}
