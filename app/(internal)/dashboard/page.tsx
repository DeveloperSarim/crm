import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser, getUserProfile } from '@/lib/supabase/cached'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { Avatar } from '@/components/shared/Avatar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { format, startOfDay, subDays, startOfQuarter } from 'date-fns'
import Link from 'next/link'
import { Download, Plus, TrendingUp, TrendingDown } from 'lucide-react'

const RANGES = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7d' },
  { id: '30d', label: '30d' },
  { id: 'quarter', label: 'Quarter' },
] as const

type Range = typeof RANGES[number]['id']

function getRangeStart(range: Range): string {
  const now = new Date()
  switch (range) {
    case 'today':   return startOfDay(now).toISOString()
    case '7d':      return subDays(now, 7).toISOString()
    case '30d':     return subDays(now, 30).toISOString()
    case 'quarter': return startOfQuarter(now).toISOString()
  }
}

function getPrevRangeStart(range: Range): string {
  const now = new Date()
  switch (range) {
    case 'today':   return subDays(startOfDay(now), 1).toISOString()
    case '7d':      return subDays(now, 14).toISOString()
    case '30d':     return subDays(now, 60).toISOString()
    case 'quarter': return startOfQuarter(subDays(startOfQuarter(now), 1)).toISOString()
  }
}

interface PageProps {
  searchParams: Promise<{ range?: string }>
}

// ── Shell renders instantly (auth already cached from layout) ─────────────
export default async function DashboardPage({ searchParams }: PageProps) {
  const { range: rawRange = '7d' } = await searchParams
  const range = (RANGES.map(r => r.id).includes(rawRange as Range) ? rawRange : '7d') as Range

  const user = await getAuthUser()
  if (!user) redirect('/login')

  const profile = await getUserProfile(user.id)
  if (!profile) redirect('/login')

  const greeting = getGreeting()
  const today = format(new Date(), 'EEEE, MMMM d')

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Topbar — zero DB calls, instant */}
      <Topbar
        crumbs={['Workspace', 'Dashboard']}
        action={
          <Link href="/leads/new" className="inline-flex items-center gap-1.5 rounded-[6px] bg-brand px-2.5 py-[5px] text-[13px] font-medium text-white shadow-[0_1px_0_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.12)]">
            <Plus size={13} /> New lead
          </Link>
        }
      />

      <div className="flex-1 overflow-auto p-[16px_16px_24px] sm:p-[22px_28px_32px]">
        {/* Header — instant (no DB) */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[12.5px] text-content-2">{today}</div>
            <h1 className="text-[20px] font-semibold tracking-[-0.02em] sm:text-[22px]">
              {greeting}, {profile.full_name.split(' ')[0]}
            </h1>
          </div>

          {/* Time range picker */}
          <div className="flex gap-1.5 rounded-[7px] border border-border bg-surface-2 p-[3px]">
            {RANGES.map(r => (
              <Link
                key={r.id}
                href={`/dashboard?range=${r.id}`}
                className="rounded-[5px] px-2.5 py-1 text-[12px] transition-all"
                style={{
                  background: range === r.id ? '#fff' : 'transparent',
                  color: range === r.id ? '#111827' : '#6B7280',
                  fontWeight: range === r.id ? 500 : 400,
                  boxShadow: range === r.id ? '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' : 'none',
                }}
              >
                {r.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Stats + Content — stream in while header is already visible */}
        <Suspense fallback={<DashboardContentSkeleton />}>
          <DashboardContent
            range={range}
            userId={user.id}
            isHead={profile.role === 'head'}
          />
        </Suspense>
      </div>
    </div>
  )
}

// ── All DB work happens here, streamed via Suspense ───────────────────────
async function DashboardContent({
  range, userId, isHead,
}: {
  range: Range
  userId: string
  isHead: boolean
}) {
  const supabase = await createClient()
  const rangeStart = getRangeStart(range)
  const prevStart = getPrevRangeStart(range)

  const [
    recentLeadsResult,
    statusCountsResult,
    currPeriodResult,
    prevPeriodResult,
    myLeadsResult,
    myWonResult,
    myFollowupsResult,
    headStatsResult,
  ] = await Promise.all([
    isHead
      ? supabase.from('leads').select('id, full_name, status, created_at, project:projects(name,slug), assigned:profiles!leads_assigned_to_fkey(full_name), source:lead_sources(name)').gte('created_at', rangeStart).order('created_at', { ascending: false }).limit(8)
      : supabase.from('leads').select('id, full_name, status, created_at, project:projects(name,slug), assigned:profiles!leads_assigned_to_fkey(full_name), source:lead_sources(name)').eq('assigned_to', userId).gte('created_at', rangeStart).order('created_at', { ascending: false }).limit(8),

    isHead
      ? supabase.from('leads').select('status')
      : supabase.from('leads').select('status').eq('assigned_to', userId),

    isHead
      ? supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', rangeStart)
      : supabase.from('leads').select('*', { count: 'exact', head: true }).eq('assigned_to', userId).gte('created_at', rangeStart),

    isHead
      ? supabase.from('leads').select('*', { count: 'exact', head: true }).gte('created_at', prevStart).lt('created_at', rangeStart)
      : supabase.from('leads').select('*', { count: 'exact', head: true }).eq('assigned_to', userId).gte('created_at', prevStart).lt('created_at', rangeStart),

    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('assigned_to', userId),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('assigned_to', userId).eq('status', 'closed_won'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('assigned_to', userId).lte('follow_up_date', new Date().toISOString().split('T')[0]).not('status', 'in', '(closed_won,closed_lost)'),
    isHead ? supabase.rpc('get_dashboard_stats') : Promise.resolve({ data: null }),
  ])

  const recentLeads = recentLeadsResult.data ?? []
  const allStatuses: { status: string }[] = statusCountsResult.data ?? []
  const currCount = currPeriodResult.count ?? 0
  const prevCount = prevPeriodResult.count ?? 0

  const delta = prevCount > 0 ? (((currCount - prevCount) / prevCount) * 100).toFixed(1) : currCount > 0 ? '+100' : '0'
  const deltaKind: 'up' | 'down' | 'neutral' = currCount > prevCount ? 'up' : currCount < prevCount ? 'down' : 'neutral'

  const headStats = isHead && headStatsResult.data
    ? (headStatsResult.data as any)
    : { total_leads: myLeadsResult.count ?? 0, active_projects: 0, closed_won: myWonResult.count ?? 0, closed_lost: 0, pending_follow_ups: myFollowupsResult.count ?? 0 }

  // Pipeline funnel
  const STATUS_ORDER = ['new', 'contacted', 'interested', 'site_visit', 'negotiation', 'closed_won', 'closed_lost', 'on_hold']
  const STATUS_COLORS: Record<string, string> = {
    new: '#3B82F6', contacted: '#F59E0B', interested: '#8B5CF6',
    site_visit: '#0EA5E9', negotiation: '#F97316', closed_won: '#10B981', closed_lost: '#EF4444', on_hold: '#9CA3AF',
  }
  const STATUS_LABELS: Record<string, string> = {
    new: 'New', contacted: 'Contacted', interested: 'Interested',
    site_visit: 'Site Visit', negotiation: 'Negotiation', closed_won: 'Closed Won', closed_lost: 'Closed Lost', on_hold: 'On Hold',
  }
  const statusCounts: Record<string, number> = {}
  allStatuses.forEach(l => { statusCounts[l.status] = (statusCounts[l.status] ?? 0) + 1 })
  const totalLeads = Object.values(statusCounts).reduce((s, c) => s + c, 0)
  const pipelineRows = STATUS_ORDER.filter(s => statusCounts[s]).map(s => ({
    label: STATUS_LABELS[s], count: statusCounts[s],
    pct: totalLeads > 0 ? Math.round((statusCounts[s] / totalLeads) * 100) : 0,
    color: STATUS_COLORS[s],
  })).sort((a, b) => b.count - a.count).slice(0, 5)
  const maxCount = pipelineRows[0]?.count ?? 1

  const convRate = headStats.total_leads > 0
    ? ((headStats.closed_won / headStats.total_leads) * 100).toFixed(1)
    : '0.0'

  const rangeLabel = range === 'today' ? 'today' : range === '7d' ? 'last 7 days' : range === '30d' ? 'last 30 days' : 'this quarter'
  const prevLabel = range === 'today' ? 'day' : range === '7d' ? '7 days' : range === '30d' ? '30 days' : 'quarter'

  return (
    <>
      {/* Stat Cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Leads this period" value={currCount.toLocaleString()}
          delta={prevCount > 0 ? `${deltaKind === 'up' ? '+' : ''}${delta}%` : undefined}
          deltaKind={deltaKind} sub={`vs. previous ${prevLabel}`} accent="#3B82F6" />
        <StatCard label="Total leads" value={headStats.total_leads.toLocaleString()} sub="All time" accent="#0EA5E9" />
        <StatCard label="Conversion rate" value={`${convRate}%`} sub="Lead → Closed Won" accent="#10B981" />
        <StatCard label="Follow-ups due" value={headStats.pending_follow_ups.toString()}
          delta={headStats.pending_follow_ups > 0 ? `${headStats.pending_follow_ups} overdue` : undefined}
          deltaKind={headStats.pending_follow_ups > 0 ? 'down' : 'neutral'}
          sub="Due today or earlier" accent="#F59E0B" />
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.7fr_1fr]">
        {/* Recent leads */}
        <section className="overflow-hidden rounded-[10px] border border-border bg-white">
          <div className="flex items-center border-b border-border px-3.5 py-3">
            <h3 className="text-[13px] font-semibold">Recent leads</h3>
            <span className="ml-2 text-[12px] text-content-3">{rangeLabel}</span>
            <div className="flex-1" />
            <Link href="/leads" className="inline-flex items-center gap-1 rounded-[6px] border border-border bg-white px-2 py-[3px] text-[12px] font-medium text-content hover:bg-surface-2">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] border-collapse text-[13px]">
            <thead>
              <tr className="text-content-3">
                {['Name', 'Project', 'Source', 'Owner', 'Status'].map(h => (
                  <th key={h} className="border-b border-border/60 px-3.5 py-2 text-left text-[11px] font-medium uppercase tracking-[0.04em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentLeads.map(l => (
                <tr key={l.id} className="border-b border-border/40 hover:bg-surface-2">
                  <td className="px-3.5 py-[9px]">
                    <Link href={`/projects/${(l.project as any)?.slug}/leads/${l.id}`} className="flex items-center gap-2 hover:text-brand">
                      <Avatar name={l.full_name} size={20} />
                      <span className="font-medium">{l.full_name}</span>
                    </Link>
                  </td>
                  <td className="px-3.5 py-[9px] text-content-2">{(l.project as any)?.name ?? '—'}</td>
                  <td className="px-3.5 py-[9px] text-content-2">{(l.source as any)?.name ?? '—'}</td>
                  <td className="px-3.5 py-[9px]">
                    {(l.assigned as any)?.full_name
                      ? <span className="flex items-center gap-1.5"><Avatar name={(l.assigned as any).full_name} size={18} />{(l.assigned as any).full_name}</span>
                      : <span className="text-content-3">Unassigned</span>}
                  </td>
                  <td className="px-3.5 py-[9px]"><StatusBadge kind={l.status} /></td>
                </tr>
              ))}
              {recentLeads.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-[13px] text-content-3">
                  No leads in this period — <Link href="/leads/new" className="text-brand hover:underline">add the first one</Link>
                </td></tr>
              )}
            </tbody>
          </table>
          </div>
        </section>

        {/* Right column */}
        <div className="flex flex-col gap-3">
          {/* Pipeline funnel */}
          <section className="rounded-[10px] border border-border bg-white p-3.5">
            <div className="mb-3 flex items-center">
              <h3 className="text-[13px] font-semibold">Pipeline funnel</h3>
              <div className="flex-1" />
              <span className="text-[11.5px] text-content-3">All time</span>
            </div>
            {pipelineRows.length > 0 ? pipelineRows.map(row => (
              <div key={row.label} className="flex items-center gap-3 py-1.5">
                <div className="flex w-[100px] items-center gap-1.5 text-[12px] text-content-2">
                  <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: row.color }} />
                  {row.label}
                </div>
                <div className="h-[6px] flex-1 overflow-hidden rounded-[3px] bg-[#F3F4F6]">
                  <div className="h-full rounded-[3px]" style={{ width: `${Math.round((row.count / maxCount) * 100)}%`, background: row.color }} />
                </div>
                <div className="w-8 text-right font-tabular text-[12px] font-medium">{row.count}</div>
                <div className="w-9 text-right font-tabular text-[11px] text-content-3">{row.pct}%</div>
              </div>
            )) : <div className="py-6 text-center text-[12px] text-content-3">No lead data yet</div>}
          </section>

          {/* Quick actions */}
          <section className="rounded-[10px] border border-border bg-white p-3.5">
            <h3 className="mb-3 text-[13px] font-semibold">Quick actions</h3>
            <div className="flex flex-col gap-1.5">
              <Link href="/leads/new" className="flex items-center gap-2 rounded-[6px] border border-border bg-white px-3 py-2 text-[13px] text-content transition-colors hover:bg-surface-2">
                <Plus size={13} className="text-content-3" /> Add lead manually
              </Link>
              {isHead && (
                <Link href="/projects/new" className="flex items-center gap-2 rounded-[6px] border border-border bg-white px-3 py-2 text-[13px] text-content transition-colors hover:bg-surface-2">
                  <Plus size={13} className="text-content-3" /> New project
                </Link>
              )}
              <Link href="/leads?import=1" className="flex items-center gap-2 rounded-[6px] border border-border bg-white px-3 py-2 text-[13px] text-content transition-colors hover:bg-surface-2">
                <Download size={13} className="text-content-3" /> Import from CSV
              </Link>
              {isHead && (
                <Link href="/statistics" className="flex items-center gap-2 rounded-[6px] border border-border bg-white px-3 py-2 text-[13px] text-content transition-colors hover:bg-surface-2">
                  <TrendingUp size={13} className="text-content-3" /> Full analytics
                </Link>
              )}
            </div>
          </section>

          {/* Period summary */}
          <section className="rounded-[10px] border border-border bg-white p-3.5">
            <h3 className="mb-3 text-[13px] font-semibold">Period summary</h3>
            <div className="space-y-2">
              {[
                { label: 'New leads', value: currCount, color: '#3B82F6' },
                { label: 'Closed won', value: headStats.closed_won, color: '#10B981' },
                { label: 'Closed lost', value: headStats.closed_lost, color: '#EF4444' },
                { label: 'Follow-ups due', value: headStats.pending_follow_ups, color: '#F59E0B' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[12.5px] text-content-2">
                    <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: row.color }} />
                    {row.label}
                  </div>
                  <span className="font-tabular text-[13px] font-semibold text-content">{row.value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

function DashboardContentSkeleton() {
  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex min-h-[100px] flex-col gap-2 rounded-[10px] border border-border bg-white p-4">
            <div className="h-3 w-20 animate-pulse rounded-full bg-[#F3F4F6]" />
            <div className="h-8 w-20 animate-pulse rounded-full bg-[#E5E7EB]" />
            <div className="h-3 w-24 animate-pulse rounded-full bg-[#F9FAFB]" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.7fr_1fr]">
        <div className="overflow-hidden rounded-[10px] border border-border bg-white">
          <div className="h-10 animate-pulse bg-[#FAFAFB]" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 border-t border-border/40 px-3.5 py-[9px]">
              <div className="h-5 w-5 animate-pulse rounded-full bg-[#F3F4F6]" />
              <div className="h-3 w-28 animate-pulse rounded-full bg-[#E5E7EB]" />
              <div className="flex-1" />
              <div className="h-5 w-16 animate-pulse rounded-[4px] bg-[#F3F4F6]" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <div className="h-44 animate-pulse rounded-[10px] border border-border bg-white" />
          <div className="h-36 animate-pulse rounded-[10px] border border-border bg-white" />
        </div>
      </div>
    </>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function StatCard({ label, value, delta, deltaKind, sub, accent }: {
  label: string; value: string; delta?: string; deltaKind?: 'up' | 'down' | 'neutral'; sub?: string; accent: string
}) {
  return (
    <div className="flex min-h-[100px] flex-col gap-1.5 rounded-[10px] border border-border bg-white p-4">
      <span className="text-[12.5px] font-medium text-content-2">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-[28px] font-semibold tracking-[-0.02em] text-content">{value}</span>
        {delta && deltaKind !== 'neutral' && (
          <span className={`inline-flex items-center gap-0.5 text-[12px] font-medium ${deltaKind === 'up' ? 'text-[#047857]' : 'text-[#B91C1C]'}`}>
            {deltaKind === 'up' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {delta}
          </span>
        )}
      </div>
      {sub && <div className="text-[11.5px] text-content-3">{sub}</div>}
      <div className="mt-auto h-[3px] w-full overflow-hidden rounded-full bg-[#F3F4F6]">
        <div className="h-full w-full rounded-full opacity-40" style={{ background: accent }} />
      </div>
    </div>
  )
}
