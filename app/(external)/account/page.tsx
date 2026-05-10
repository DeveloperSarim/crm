import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="mb-6 text-[20px] sm:text-[22px] font-semibold tracking-[-0.02em]">Account</h1>

      <div className="rounded-[10px] border border-border bg-white p-4 sm:p-5">
        <h2 className="mb-4 text-[13px] font-semibold">Profile</h2>
        <dl className="space-y-3">
          {[
            ['Name', profile.full_name],
            ['Email', profile.email],
            ['Phone', profile.phone ?? '—'],
            ['Company', profile.company_name ?? '—'],
            ['Role', 'External Partner'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-start gap-3 sm:items-center sm:gap-4">
              <dt className="w-20 flex-none text-[12px] font-medium text-content-3 sm:w-24">{k}</dt>
              <dd className="min-w-0 break-words text-[13px] text-content">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-4 rounded-[10px] border border-border bg-white p-4 sm:p-5">
        <h2 className="mb-3 text-[13px] font-semibold">Sign out</h2>
        <form action="/api/auth/signout" method="post">
          <button type="submit" className="rounded-[7px] border border-[#EF4444]/30 bg-[#FEF2F2] px-3 py-2 text-[13px] font-medium text-[#EF4444] hover:bg-[#FEE2E2] sm:py-1.5">
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}
