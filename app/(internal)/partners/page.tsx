import { createClient } from '@/lib/supabase/server'
import { getAuthUser, getUserProfile } from '@/lib/supabase/cached'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { Avatar } from '@/components/shared/Avatar'
import { InvitePartnerButton } from '@/components/team/InvitePartnerButton'
import { PartnerToggle } from '@/components/team/PartnerToggle'
import { EditPartnerButton } from '@/components/team/EditPartnerButton'
import { Building2, TrendingUp } from 'lucide-react'

export default async function PartnersPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const profile = await getUserProfile(user.id)
  if (profile?.role !== 'head') redirect('/dashboard')

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar
        crumbs={['Workspace', 'Partners']}
        action={<InvitePartnerButton />}
      />
      <div className="flex-1 overflow-auto p-[16px_16px_24px] sm:p-[22px_28px_32px]">
        <Suspense fallback={<PartnersSkeleton />}>
          <PartnersContent />
        </Suspense>
      </div>
    </div>
  )
}

async function PartnersContent() {
  const supabase = await createClient()

  // Fetch all external partners + their lead stats
  const { data: partners } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'external')
    .order('created_at', { ascending: false })

  // For each partner, fetch lead counts
  const partnerIds = (partners ?? []).map(p => p.id)
  const { data: leadCounts } = partnerIds.length > 0
    ? await supabase
        .from('leads')
        .select('external_realtor_id, status')
        .in('external_realtor_id', partnerIds)
    : { data: [] }

  // Build stats per partner
  const statsMap: Record<string, { total: number; won: number; pending: number }> = {}
  for (const lead of leadCounts ?? []) {
    const pid = lead.external_realtor_id
    if (!pid) continue
    if (!statsMap[pid]) statsMap[pid] = { total: 0, won: 0, pending: 0 }
    statsMap[pid].total++
    if (lead.status === 'won') statsMap[pid].won++
    if (['new', 'follow_up', 'interested', 'site_visited'].includes(lead.status)) statsMap[pid].pending++
  }

  const totalPartners = (partners ?? []).length
  const activePartners = (partners ?? []).filter(p => p.is_active).length
  const totalLeads = (leadCounts ?? []).length

  return (
    <>
      {/* Header */}
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] sm:text-[22px]">Partners</h1>
          <p className="mt-0.5 text-[13px] text-[#6B7280]">External realtors with access to the partner portal</p>
        </div>
      </div>

      {/* Stat strip */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { label: 'Total partners', value: totalPartners },
          { label: 'Active',         value: activePartners },
          { label: 'Total leads',    value: totalLeads },
        ].map(s => (
          <div key={s.label} className="rounded-[10px] border border-[#E5E7EB] bg-white p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#9CA3AF]">{s.label}</div>
            <div className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-[#111827]">{s.value}</div>
          </div>
        ))}
      </div>

      {(!partners || partners.length === 0) ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#FAFAFB]">
                  {['Partner', 'Channel', 'Email', 'Phone', 'Leads', 'Won', 'Status', ''].map(h => (
                    <th
                      key={h}
                      className="px-3.5 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.04em] text-[#9CA3AF]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {partners.map(partner => {
                  const stats = statsMap[partner.id] ?? { total: 0, won: 0, pending: 0 }
                  return (
                    <tr key={partner.id} className="border-t border-[#EEF0F3] hover:bg-[#FAFAFB]">
                      {/* Partner */}
                      <td className="px-3.5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={partner.full_name} size={28} />
                          <div>
                            <div className="font-medium text-[#111827]">{partner.full_name}</div>
                            <div className="mt-0.5 text-[11px] text-[#9CA3AF]">
                              Joined {new Date(partner.created_at).toLocaleDateString('en-SA', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Channel */}
                      <td className="px-3.5 py-3 text-[#6B7280]">
                        {partner.company_name ? (
                          <span className="inline-flex items-center gap-1">
                            <Building2 size={11} className="text-[#9CA3AF]" />
                            {partner.company_name}
                          </span>
                        ) : <span className="text-[#D1D5DB]">—</span>}
                      </td>
                      {/* Email */}
                      <td className="px-3.5 py-3 text-[#6B7280]">{partner.email}</td>
                      {/* Phone */}
                      <td className="px-3.5 py-3 font-mono text-[12px] text-[#6B7280]">
                        {partner.phone ?? <span className="font-sans text-[#D1D5DB]">—</span>}
                      </td>
                      {/* Total leads */}
                      <td className="px-3.5 py-3">
                        <span className="font-tabular text-[#111827]">{stats.total}</span>
                        {stats.pending > 0 && (
                          <span className="ml-1.5 text-[11px] text-[#6B7280]">{stats.pending} active</span>
                        )}
                      </td>
                      {/* Won */}
                      <td className="px-3.5 py-3">
                        {stats.won > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[#16A34A]">
                            <TrendingUp size={11} />
                            {stats.won}
                          </span>
                        ) : <span className="text-[#D1D5DB]">—</span>}
                      </td>
                      {/* Status toggle */}
                      <td className="px-3.5 py-3">
                        <PartnerToggle partnerId={partner.id} isActive={partner.is_active ?? true} />
                      </td>
                      {/* Actions */}
                      <td className="px-3.5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <EditPartnerButton partner={{
                            id: partner.id,
                            full_name: partner.full_name,
                            email: partner.email,
                            phone: partner.phone,
                            company_name: partner.company_name,
                          }} />
                          <a
                            href={`mailto:${partner.email}`}
                            className="rounded-[5px] border border-[#E5E7EB] px-2 py-1 text-[12px] text-[#6B7280] hover:bg-[#F9FAFB]"
                          >
                            Email
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white py-20 text-center">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6]">
        <Building2 size={18} className="text-[#9CA3AF]" />
      </div>
      <div className="text-[14px] font-medium text-[#111827]">No partners yet</div>
      <p className="mt-1 max-w-[280px] text-[13px] text-[#6B7280]">
        Invite your first external realtor — they&apos;ll get an email to set up their account and access the portal.
      </p>
    </div>
  )
}

function PartnersSkeleton() {
  return (
    <div className="overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white">
      <div className="border-b border-[#E5E7EB] bg-[#FAFAFB] px-3.5 py-2.5">
        <div className="grid grid-cols-8 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-3 animate-pulse rounded-full bg-[#E5E7EB]" />
          ))}
        </div>
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-t border-[#EEF0F3] px-3.5 py-3.5">
          <div className="flex items-center gap-2.5 flex-[2]">
            <div className="h-7 w-7 animate-pulse rounded-full bg-[#F3F4F6]" />
            <div className="h-3.5 w-32 animate-pulse rounded-full bg-[#F3F4F6]" />
          </div>
          <div className="h-3 flex-1 animate-pulse rounded-full bg-[#F9FAFB]" />
          <div className="h-3 flex-[2] animate-pulse rounded-full bg-[#F9FAFB]" />
          <div className="h-3 flex-1 animate-pulse rounded-full bg-[#F9FAFB]" />
          <div className="h-5 w-14 animate-pulse rounded-[4px] bg-[#F3F4F6]" />
        </div>
      ))}
    </div>
  )
}
