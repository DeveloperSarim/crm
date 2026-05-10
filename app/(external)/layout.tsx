import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Logo } from '@/components/shared/Logo'
import { Avatar } from '@/components/shared/Avatar'
import { PortalNav } from '@/components/portal/PortalNav'
import Link from 'next/link'

export default async function ExternalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/partner/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/partner/login')
  if (profile.role !== 'external') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#FAFAFB] font-sans text-content">
      {/* Top nav */}
      <header className="sticky top-0 z-10 border-b border-[#E5E7EB] bg-white" style={{ height: 56 }}>
        <div className="flex h-full items-center px-4 sm:px-6">
          {/* Logo + portal badge */}
          <div className="flex flex-none items-center gap-2">
            <Logo />
            <span className="hidden rounded-[4px] bg-[#EEF2FF] px-[7px] py-[2px] text-[11px] font-semibold text-[#4F46E5] sm:inline">
              Realtor Portal
            </span>
          </div>

          {/* Nav links — scrolls horizontally on mobile */}
          <div className="flex min-w-0 flex-1 items-center overflow-x-auto scrollbar-none">
            <PortalNav />
          </div>

          {/* User */}
          <div className="ml-3 flex flex-none items-center gap-2">
            <Link href="/account" className="flex items-center gap-2 rounded-[6px] px-2 py-1 hover:bg-[#F3F4F6]">
              <Avatar name={profile.full_name} size={28} />
              <span className="hidden text-[13px] font-medium text-[#374151] sm:block">
                {profile.full_name}
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  )
}
