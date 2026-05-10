import { createClient } from '@/lib/supabase/server'
import { getAuthUser, getUserProfile } from '@/lib/supabase/cached'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { Avatar } from '@/components/shared/Avatar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LeadsImportButton } from '@/components/leads/LeadsImportButton'
import Link from 'next/link'
import { Plus, ExternalLink } from 'lucide-react'

// ── Page shell — renders instantly with cached auth ─────────────────────────
export default async function LeadsPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const profile = await getUserProfile(user.id)
  const role = (profile as any)?.role
  // external users don't belong here
  if (role === 'external') redirect('/portal')

  const isHead = role === 'head'

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar
        crumbs={['Workspace', 'Leads']}
        action={
          isHead ? (
            <div className="flex items-center gap-1.5">
              <Suspense fallback={
                <div className="h-[29px] w-[90px] animate-pulse rounded-[6px] bg-[#F3F4F6]" />
              }>
                <LeadsImportButtonServer />
              </Suspense>
              <Link
                href="/leads/new"
                className="inline-flex items-center gap-1.5 rounded-[6px] bg-brand px-2.5 py-[5px] text-[13px] font-medium text-white shadow-[0_1px_0_rgba(0,0,0,0.04)]"
              >
                <Plus size={13} /> New lead
              </Link>
            </div>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-auto p-[16px_16px_24px] sm:p-[22px_28px_32px]">
        <div className="mb-4 flex items-center">
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] sm:text-[22px]">
            {isHead ? 'All Leads' : 'My Leads'}
          </h1>
        </div>

        <Suspense fallback={<LeadsContentSkeleton />}>
          <LeadsContent userId={user.id} role={role} />
        </Suspense>
      </div>
    </div>
  )
}

// ── Import button needs projects + sources — load async ─────────────────────
async function LeadsImportButtonServer() {
  const supabase = await createClient()
  const [{ data: projects }, { data: sources }] = await Promise.all([
    supabase.from('projects').select('id, name').neq('status', 'archived').order('name'),
    supabase.from('lead_sources').select('id, name').eq('is_active', true).order('name'),
  ])
  return (
    <LeadsImportButton
      projects={(projects ?? []) as any}
      sources={(sources ?? []) as any}
    />
  )
}

// ── Data-fetching component (streams in) ─────────────────────────────────────
async function LeadsContent({ userId, role }: { userId: string; role: string }) {
  const supabase = await createClient()

  let query = supabase
    .from('leads')
    .select(`
      id, reference_id, full_name, phone, status, budget_display, created_at,
      project:projects(name, slug),
      source:lead_sources(name),
      assigned:profiles!leads_assigned_to_fkey(id, full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  // Sales members only see their own assigned leads
  if (role === 'sales_member') {
    query = query.eq('assigned_to', userId)
  }

  const { data: leads } = await query

  const statusCounts = {
    all: leads?.length ?? 0,
    new: leads?.filter(l => (l as any).status === 'new').length ?? 0,
    interested: leads?.filter(l => (l as any).status === 'interested').length ?? 0,
    closed_won: leads?.filter(l => (l as any).status === 'closed_won').length ?? 0,
  }

  // Column headers — hide "Owner" column for sales members (all leads are theirs)
  const headers = role === 'head'
    ? ['Name', 'Phone', 'Project', 'Source', 'Owner', 'Status', 'Budget', 'Added', '']
    : ['Name', 'Phone', 'Project', 'Source', 'Status', 'Budget', 'Added', '']

  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total', value: statusCounts.all, color: '#3B82F6' },
          { label: 'New', value: statusCounts.new, color: '#F59E0B' },
          { label: 'Interested', value: statusCounts.interested, color: '#8B5CF6' },
          { label: 'Closed Won', value: statusCounts.closed_won, color: '#10B981' },
        ].map(s => (
          <div key={s.label} className="rounded-[10px] border border-border bg-white p-4">
            <div className="text-[12px] font-medium text-content-2">{s.label}</div>
            <div className="mt-1 text-[24px] font-semibold tracking-[-0.02em]" style={{ color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[10px] border border-border bg-white">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-[13px]">
          <thead>
            <tr className="bg-[#FAFAFB]">
              {headers.map((h, i) => (
                <th key={i} className="px-3.5 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.04em] text-content-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(leads ?? []).map(lead => {
              const l = lead as any
              const detailHref = l.project?.slug ? `/projects/${l.project.slug}/leads/${l.id}` : null
              return (
                <tr key={l.id} className="border-t border-[#EEF0F3] hover:bg-[#FAFAFB]">
                  {/* Name */}
                  <td className="px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <Avatar name={l.full_name} size={22} />
                      <div>
                        <span className="font-medium text-content">{l.full_name}</span>
                        {l.reference_id && (
                          <div className="text-[11.5px] text-content-3">{l.reference_id}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  {/* Phone */}
                  <td className="px-3.5 py-2.5">
                    <a href={`tel:${l.phone}`} className="font-tabular text-[12.5px] text-content-2 hover:text-brand transition-colors">
                      {l.phone}
                    </a>
                  </td>
                  {/* Project */}
                  <td className="px-3.5 py-2.5">
                    {l.project?.slug ? (
                      <Link href={`/projects/${l.project.slug}?tab=leads`} className="text-content-2 hover:text-brand">
                        {l.project.name}
                      </Link>
                    ) : <span className="text-content-3">—</span>}
                  </td>
                  {/* Source */}
                  <td className="px-3.5 py-2.5 text-content-2">{l.source?.name ?? '—'}</td>
                  {/* Owner — head only */}
                  {role === 'head' && (
                    <td className="px-3.5 py-2.5">
                      {l.assigned?.full_name ? (
                        <span className="flex items-center gap-1.5">
                          <Avatar name={l.assigned.full_name} size={18} />
                          {l.assigned.full_name}
                        </span>
                      ) : <span className="text-content-3">Unassigned</span>}
                    </td>
                  )}
                  {/* Status */}
                  <td className="px-3.5 py-2.5"><StatusBadge kind={l.status} /></td>
                  {/* Budget */}
                  <td className="px-3.5 py-2.5 font-tabular text-content-2">{l.budget_display ?? '—'}</td>
                  {/* Added */}
                  <td className="px-3.5 py-2.5 text-content-3">
                    {new Date(l.created_at).toLocaleDateString('en-SA', { day: 'numeric', month: 'short' })}
                  </td>
                  {/* View detail */}
                  <td className="px-3.5 py-2.5">
                    {detailHref ? (
                      <Link
                        href={detailHref}
                        className="inline-flex items-center gap-1 rounded-[5px] border border-border px-2 py-1 text-[11.5px] font-medium text-content-2 hover:border-brand/40 hover:text-brand transition-colors"
                      >
                        <ExternalLink size={11} /> View
                      </Link>
                    ) : null}
                  </td>
                </tr>
              )
            })}
            {(!leads || leads.length === 0) && (
              <tr>
                <td colSpan={headers.length} className="py-12 text-center text-[13px] text-content-3">
                  {role === 'sales_member' ? 'No leads assigned to you yet' : 'No leads yet'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </>
  )
}

// ── Skeleton fallback ────────────────────────────────────────────────────────
function LeadsContentSkeleton() {
  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-[10px] border border-border bg-white p-4">
            <div className="mb-2 h-3 w-12 animate-pulse rounded-full bg-[#F3F4F6]" />
            <div className="h-7 w-16 animate-pulse rounded-md bg-[#E5E7EB]" />
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-[10px] border border-border bg-white">
        <div className="border-b border-border bg-[#FAFAFB] px-3.5 py-2.5">
          <div className="grid grid-cols-8 gap-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-3 w-full animate-pulse rounded-full bg-[#E5E7EB]" />
            ))}
          </div>
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-t border-[#EEF0F3] px-3.5 py-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="h-[22px] w-[22px] animate-pulse rounded-full bg-[#F3F4F6]" />
              <div className="h-3.5 w-28 animate-pulse rounded-full bg-[#F3F4F6]" />
            </div>
            <div className="h-3 w-20 animate-pulse rounded-full bg-[#F9FAFB]" />
            <div className="h-3 w-16 animate-pulse rounded-full bg-[#F9FAFB]" />
            <div className="h-3 w-20 animate-pulse rounded-full bg-[#F9FAFB]" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-[#F3F4F6]" />
            <div className="h-3 w-12 animate-pulse rounded-full bg-[#F9FAFB]" />
            <div className="h-3 w-10 animate-pulse rounded-full bg-[#F9FAFB]" />
          </div>
        ))}
      </div>
    </>
  )
}
