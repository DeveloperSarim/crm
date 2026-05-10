import { createClient } from '@/lib/supabase/server'
import { getAuthUser, getUserProfile } from '@/lib/supabase/cached'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { TrendingUp } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  new: '#3B82F6', contacted: '#F59E0B', interested: '#8B5CF6',
  site_visit: '#0EA5E9', negotiation: '#F97316',
  closed_won: '#10B981', closed_lost: '#EF4444', on_hold: '#9CA3AF',
}
const STATUS_LABELS: Record<string, string> = {
  new: 'New', contacted: 'Contacted', interested: 'Interested',
  site_visit: 'Site Visit', negotiation: 'Negotiation',
  closed_won: 'Closed Won', closed_lost: 'Closed Lost', on_hold: 'On Hold',
}

// ── Page shell — renders instantly with cached auth ─────────────────────────
export default async function StatisticsPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const profile = await getUserProfile(user.id)
  if (profile?.role !== 'head') redirect('/dashboard')

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar crumbs={['Workspace', 'Statistics']} />
      <div className="flex-1 overflow-auto p-[16px_16px_24px] sm:p-[22px_28px_32px]">
        <h1 className="mb-5 text-[20px] font-semibold tracking-[-0.02em] sm:text-[22px]">Statistics</h1>

        <Suspense fallback={<StatisticsSkeleton />}>
          <StatisticsContent />
        </Suspense>
      </div>
    </div>
  )
}

// ── Data-fetching component (streams in) ─────────────────────────────────────
async function StatisticsContent() {
  const supabase = await createClient()

  const [
    { count: totalLeads },
    { count: closedWon },
    { count: closedLost },
    { count: activeProjects },
    { data: sourceStats },
    { data: statusStats },
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'closed_won'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'closed_lost'),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('leads').select('source:lead_sources(name)'),
    supabase.from('leads').select('status'),
  ])

  const convRate = totalLeads ? (((closedWon ?? 0) / totalLeads) * 100).toFixed(1) : '0.0'

  const sourceCounts: Record<string, number> = {}
  ;(sourceStats ?? []).forEach((l: any) => {
    const name = l.source?.name ?? 'Unknown'
    sourceCounts[name] = (sourceCounts[name] ?? 0) + 1
  })
  const topSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  const statusCounts: Record<string, number> = {}
  ;(statusStats ?? []).forEach((l: any) => {
    statusCounts[l.status] = (statusCounts[l.status] ?? 0) + 1
  })

  return (
    <>
      {/* KPI grid */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Leads', value: totalLeads ?? 0, color: '#3B82F6' },
          { label: 'Active Projects', value: activeProjects ?? 0, color: '#0EA5E9' },
          { label: 'Closed Won', value: closedWon ?? 0, color: '#10B981' },
          { label: 'Conversion Rate', value: `${convRate}%`, color: '#8B5CF6' },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-[10px] border border-border bg-white p-4">
            <div className="mb-1 text-[12px] font-medium text-content-2">{kpi.label}</div>
            <div className="text-[28px] font-semibold tracking-[-0.02em]" style={{ color: kpi.color }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Pipeline funnel */}
        <section className="rounded-[10px] border border-border bg-white p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold">Pipeline Funnel</h2>
            <TrendingUp size={14} className="text-content-3" />
          </div>
          <div className="space-y-2.5">
            {Object.entries(statusCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => {
                const pct = totalLeads ? Math.round((count / totalLeads) * 100) : 0
                const color = STATUS_COLORS[status] ?? '#9CA3AF'
                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className="flex w-[110px] items-center gap-1.5 text-[12.5px] text-content-2">
                      <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: color }} />
                      {STATUS_LABELS[status] ?? status}
                    </div>
                    <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-[#F3F4F6]">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <div className="w-8 text-right font-tabular text-[12px] font-medium">{count}</div>
                    <div className="w-9 text-right font-tabular text-[11.5px] text-content-3">{pct}%</div>
                  </div>
                )
              })}
          </div>
        </section>

        {/* Leads by source */}
        <section className="rounded-[10px] border border-border bg-white p-4">
          <h2 className="mb-4 text-[13px] font-semibold">Leads by Source</h2>
          <div className="space-y-2.5">
            {topSources.map(([source, count]) => {
              const pct = totalLeads ? Math.round((count / totalLeads) * 100) : 0
              return (
                <div key={source} className="flex items-center gap-3">
                  <div className="w-[130px] overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px] text-content-2">
                    {source}
                  </div>
                  <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-[#F3F4F6]">
                    <div className="h-full rounded-full bg-brand/70" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-8 text-right font-tabular text-[12px] font-medium">{count}</div>
                  <div className="w-9 text-right font-tabular text-[11.5px] text-content-3">{pct}%</div>
                </div>
              )
            })}
            {topSources.length === 0 && (
              <div className="py-6 text-center text-[13px] text-content-3">No data yet</div>
            )}
          </div>
        </section>
      </div>
    </>
  )
}

// ── Skeleton fallback ────────────────────────────────────────────────────────
function StatisticsSkeleton() {
  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-[10px] border border-border bg-white p-4">
            <div className="mb-2 h-3 w-20 animate-pulse rounded-full bg-[#F3F4F6]" />
            <div className="h-8 w-16 animate-pulse rounded-md bg-[#E5E7EB]" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-[10px] border border-border bg-white p-4">
            <div className="mb-4 h-4 w-28 animate-pulse rounded-full bg-[#E5E7EB]" />
            <div className="space-y-3">
              {[...Array(6)].map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="h-3 w-[110px] animate-pulse rounded-full bg-[#F3F4F6]" />
                  <div className="h-[6px] flex-1 animate-pulse rounded-full bg-[#F3F4F6]" />
                  <div className="h-3 w-8 animate-pulse rounded-full bg-[#F9FAFB]" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
