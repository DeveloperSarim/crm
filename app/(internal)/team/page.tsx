import { createClient } from '@/lib/supabase/server'
import { getAuthUser, getUserProfile } from '@/lib/supabase/cached'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { Avatar } from '@/components/shared/Avatar'
import { InviteMemberButton } from '@/components/team/InviteMemberButton'
import { EditMemberButton } from '@/components/team/EditMemberButton'
import { TeamToggle } from '@/components/team/TeamToggle'

// ── Page shell — renders instantly with cached auth ─────────────────────────
export default async function TeamPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const profile = await getUserProfile(user.id)
  if (profile?.role !== 'head') redirect('/dashboard')

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar
        crumbs={['Workspace', 'Team']}
        action={<InviteMemberButton />}
      />
      <div className="flex-1 overflow-auto p-[16px_16px_24px] sm:p-[22px_28px_32px]">
        <div className="mb-4 flex items-center">
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] sm:text-[22px]">Team</h1>
        </div>

        <Suspense fallback={<TeamTableSkeleton />}>
          <TeamTable userId={user.id} />
        </Suspense>
      </div>
    </div>
  )
}

// ── Data-fetching component (streams in) ─────────────────────────────────────
async function TeamTable({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['head', 'sales_member'])
    .order('created_at')

  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-white">
      <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-[13px]">
        <thead>
          <tr className="bg-[#FAFAFB]">
            {['Member', 'Role', 'Email', 'Phone', 'Status', ''].map(h => (
              <th key={h} className="px-3.5 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.04em] text-content-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(members ?? []).map(member => (
            <tr key={member.id} className="border-t border-[#EEF0F3] hover:bg-[#FAFAFB]">
              <td className="px-3.5 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={member.full_name} size={28} />
                  <div>
                    <div className="font-medium">{member.full_name}</div>
                    {member.company_name && (
                      <div className="text-[11.5px] text-content-3">{member.company_name}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-3.5 py-3">
                <RolePill role={member.role} />
              </td>
              <td className="px-3.5 py-3 text-content-2">{member.email}</td>
              <td className="px-3.5 py-3 text-content-2">{member.phone ?? '—'}</td>
              <td className="px-3.5 py-3">
                {member.id !== userId ? (
                  <TeamToggle memberId={member.id} isActive={member.is_active ?? true} />
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-[4px] bg-[#ECFDF5] px-2 py-0.5 text-[11px] font-medium text-[#047857]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                    Active
                  </span>
                )}
              </td>
              <td className="px-3.5 py-3 text-right">
                {member.id !== userId && (
                  <EditMemberButton member={{
                    id: member.id,
                    full_name: member.full_name,
                    email: member.email,
                    phone: member.phone,
                    role: member.role,
                  }} />
                )}
              </td>
            </tr>
          ))}
          {(!members || members.length === 0) && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-[13px] text-content-3">No team members yet</td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  )
}

// ── Skeleton fallback ────────────────────────────────────────────────────────
function TeamTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-white">
      <div className="border-b border-border bg-[#FAFAFB] px-3.5 py-2.5">
        <div className="grid grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-3 w-full animate-pulse rounded-full bg-[#E5E7EB]" />
          ))}
        </div>
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-t border-[#EEF0F3] px-3.5 py-3.5">
          <div className="flex items-center gap-2.5 flex-1">
            <div className="h-7 w-7 animate-pulse rounded-full bg-[#F3F4F6]" />
            <div className="h-3.5 w-28 animate-pulse rounded-full bg-[#F3F4F6]" />
          </div>
          <div className="h-5 w-24 animate-pulse rounded-[4px] bg-[#F3F4F6]" />
          <div className="h-3 w-36 animate-pulse rounded-full bg-[#F9FAFB]" />
          <div className="h-3 w-20 animate-pulse rounded-full bg-[#F9FAFB]" />
          <div className="h-5 w-14 animate-pulse rounded-[4px] bg-[#F3F4F6]" />
          <div className="h-6 w-10 animate-pulse rounded-[5px] bg-[#F9FAFB]" />
        </div>
      ))}
    </div>
  )
}

function RolePill({ role }: { role: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    head: { bg: '#111827', fg: '#fff', label: 'Head / Admin' },
    sales_member: { bg: '#F5F3FF', fg: '#5B21B6', label: 'Sales Member' },
  }
  const s = map[role] ?? { bg: '#F3F4F6', fg: '#6B7280', label: role }
  return (
    <span
      className="inline-block rounded-[4px] px-2 py-0.5 text-[11px] font-medium"
      style={{ background: s.bg, color: s.fg }}
    >
      {s.label}
    </span>
  )
}
