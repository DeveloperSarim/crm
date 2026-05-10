import { createClient } from '@/lib/supabase/server'
import { getAuthUser, getUserProfile } from '@/lib/supabase/cached'
import { redirect, notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LeadsTab } from '@/components/leads/LeadsTab'
import { FilesTab } from '@/components/projects/FilesTab'
import { ShareButton } from '@/components/projects/ShareButton'
import { MapPin, Tag, Building2, Plus, Pencil } from 'lucide-react'
import { ProjectStatusEditor } from '@/components/projects/ProjectStatusEditor'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ tab?: string }>
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'leads',    label: 'Leads' },
  { id: 'files',    label: 'Files' },
  { id: 'analytics',label: 'Analytics' },
]

export default async function ProjectDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { tab = 'leads' } = await searchParams

  const user = await getAuthUser()
  if (!user) redirect('/login')

  const profile = await getUserProfile(user.id)
  const isHead = profile?.role === 'head'

  const supabase = await createClient()

  // Minimal fetch — just what the shell needs (breadcrumb, hero, share button)
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!project) notFound()

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar
        crumbs={['Workspace', 'Projects', project.name]}
        action={
          <div className="flex items-center gap-1.5">
            <ShareButton
              projectId={project.id}
              projectSlug={slug}
              isPublic={project.is_published ?? false}
              isHead={isHead}
            />
            <Link
              href={`/projects/${slug}/leads/new`}
              className="inline-flex items-center gap-1.5 rounded-[6px] bg-brand px-2.5 py-[5px] text-[13px] font-medium text-white shadow-[0_1px_0_rgba(0,0,0,0.04)]"
            >
              <Plus size={13} /> Add lead
            </Link>
          </div>
        }
      />

      <div className="flex-1 overflow-auto">
        {/* Project hero */}
        <div className="px-4 pt-4 sm:px-7 sm:pt-5">
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Cover */}
            {project.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={project.cover_image_url}
                alt={project.name}
                className="h-[72px] w-[110px] flex-none rounded-[8px] object-cover sm:h-[92px] sm:w-[140px] sm:rounded-[10px]"
              />
            ) : (
              <div
                className="h-[72px] w-[110px] flex-none rounded-[8px] sm:h-[92px] sm:w-[140px] sm:rounded-[10px]"
                style={{
                  background: `oklch(0.94 0.012 ${project.color_hue ?? 210})`,
                  backgroundImage: `repeating-linear-gradient(45deg, oklch(0.91 0.018 ${project.color_hue ?? 210}) 0, oklch(0.91 0.018 ${project.color_hue ?? 210}) 6px, transparent 0, transparent 50%)`,
                  backgroundSize: '10px 10px',
                }}
              />
            )}

            {/* Title + metadata */}
            <div className="flex-1 pt-0.5">
              <div className="mb-1.5 flex items-center gap-2.5">
                <h1 className="text-[18px] font-semibold tracking-[-0.02em] sm:text-[22px]">{project.name}</h1>
                {isHead ? (
                  <ProjectStatusEditor slug={slug} initialStatus={project.status} />
                ) : (
                  <StatusBadge kind={project.status} />
                )}
                {isHead && (
                  <Link
                    href={`/projects/${slug}/settings`}
                    className="ml-auto text-content-3 hover:text-content-2"
                    title="Project settings"
                  >
                    <Pencil size={13} />
                  </Link>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[13px] text-content-2">
                {project.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-content-3" />
                    {project.location}
                  </span>
                )}
                {Array.isArray(project.pricing_details) && (project.pricing_details as any[]).length > 0 && (
                  <span className="flex items-center gap-1">
                    <Tag size={13} className="text-content-3" />
                    {(project.pricing_details as any[])[0]?.price}
                  </span>
                )}
                {project.total_units && (
                  <span className="flex items-center gap-1">
                    <Building2 size={13} className="text-content-3" />
                    {project.total_units} units
                  </span>
                )}
                {project.rera_number && <span>RERA {project.rera_number}</span>}
              </div>
            </div>

            {/* Stats — deferred RPC */}
            {isHead && (
              <Suspense fallback={<StatsSkeleton />}>
                <ProjectStats projectId={project.id} />
              </Suspense>
            )}
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-4 overflow-x-auto border-b border-border scrollbar-none sm:mt-5 sm:gap-5">
            {TABS.map(t => (
              <Link
                key={t.id}
                href={`/projects/${slug}?tab=${t.id}`}
                className="flex items-center gap-1.5 pb-[10px] text-[13px]"
                style={{
                  color: tab === t.id ? '#111827' : '#6B7280',
                  fontWeight: tab === t.id ? 500 : 400,
                  borderBottom: tab === t.id ? '2px solid #111827' : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Tab content ──────────────────────────────────────────────────── */}

        {tab === 'leads' && (
          <LeadsTab
            projectId={project.id}
            projectSlug={slug}
            isHead={isHead}
            userId={user.id}
          />
        )}

        {tab === 'overview' && (
          <div className="p-4 sm:p-7">
            <div className="max-w-2xl">
              {project.description ? (
                <p className="text-[14px] leading-[1.6] text-content-2">{project.description}</p>
              ) : (
                <p className="text-[13px] text-content-3">No description added yet.</p>
              )}
              {project.amenities?.length > 0 && (
                <div className="mt-5">
                  <h3 className="mb-2 text-[13px] font-semibold">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.amenities.map((a: string) => (
                      <span
                        key={a}
                        className="rounded-[6px] border border-border bg-surface-2 px-2.5 py-1 text-[12.5px] text-content-2"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {Array.isArray(project.pricing_details) && (project.pricing_details as any[]).length > 0 && (
                <div className="mt-5">
                  <h3 className="mb-3 text-[13px] font-semibold">Pricing</h3>
                  <div className="space-y-2">
                    {(project.pricing_details as any[]).map((p, i) => (
                      <div key={i} className="flex items-center justify-between rounded-[8px] border border-border bg-white px-4 py-2.5">
                        <span className="text-[13px] text-content-2">{p.type ?? `Tier ${i + 1}`}</span>
                        <span className="font-tabular text-[13px] font-medium">{p.price ?? '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'files' && (
          <Suspense fallback={<FilesTabSkeleton />}>
            <FilesTabServer
              projectId={project.id}
              projectSlug={slug}
              isHead={isHead}
            />
          </Suspense>
        )}

        {tab === 'analytics' && (
          <Suspense fallback={<AnalyticsSkeleton />}>
            <ProjectAnalytics projectId={project.id} />
          </Suspense>
        )}
      </div>
    </div>
  )
}

// ── Files tab (server → passes data to client component) ─────────────────────
async function FilesTabServer({
  projectId, projectSlug, isHead,
}: {
  projectId: string; projectSlug: string; isHead: boolean
}) {
  const supabase = await createClient()
  const { data: files } = await supabase
    .from('project_files')
    .select('*')
    .eq('project_id', projectId)
    .order('uploaded_at', { ascending: false })

  return (
    <FilesTab
      projectId={projectId}
      projectSlug={projectSlug}
      initialFiles={(files ?? []) as any}
      isHead={isHead}
    />
  )
}

// ── Analytics tab (real data) ─────────────────────────────────────────────────
async function ProjectAnalytics({ projectId }: { projectId: string }) {
  const supabase = await createClient()

  const [
    { data: leads },
    { data: statusData },
  ] = await Promise.all([
    supabase.from('leads').select('id, status, created_at, budget_display').eq('project_id', projectId),
    supabase.from('leads').select('status').eq('project_id', projectId),
  ])

  const total = leads?.length ?? 0
  const won = leads?.filter(l => l.status === 'closed_won').length ?? 0
  const lost = leads?.filter(l => l.status === 'closed_lost').length ?? 0
  const active = total - won - lost

  const statusCounts: Record<string, number> = {}
  ;(statusData ?? []).forEach((l: any) => {
    statusCounts[l.status] = (statusCounts[l.status] ?? 0) + 1
  })

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

  const convRate = total > 0 ? ((won / total) * 100).toFixed(1) : '0.0'

  return (
    <div className="p-4 sm:p-7">
      {/* KPI row */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total leads', value: total, color: '#3B82F6' },
          { label: 'Active', value: active, color: '#F59E0B' },
          { label: 'Closed Won', value: won, color: '#10B981' },
          { label: 'Conversion', value: `${convRate}%`, color: '#8B5CF6' },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-[10px] border border-border bg-white p-4">
            <div className="mb-1 text-[12px] text-content-2">{kpi.label}</div>
            <div className="text-[26px] font-semibold tracking-[-0.02em]" style={{ color: kpi.color }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline breakdown */}
      {Object.keys(statusCounts).length > 0 && (
        <div className="rounded-[10px] border border-border bg-white p-4 max-w-lg">
          <h3 className="mb-4 text-[13px] font-semibold">Pipeline breakdown</h3>
          <div className="space-y-2.5">
            {Object.entries(statusCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => {
                const pct = total ? Math.round((count / total) * 100) : 0
                const color = STATUS_COLORS[status] ?? '#9CA3AF'
                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className="flex w-[110px] items-center gap-1.5 text-[12.5px] text-content-2">
                      <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: color }} />
                      {STATUS_LABELS[status] ?? status}
                    </div>
                    <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-[#F3F4F6]">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <div className="w-7 text-right font-tabular text-[12px] font-medium">{count}</div>
                    <div className="w-8 text-right font-tabular text-[11.5px] text-content-3">{pct}%</div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {total === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-[13px] text-content-3">No leads added yet. Add leads to see analytics.</div>
        </div>
      )}
    </div>
  )
}

// ── Deferred RPC stats ────────────────────────────────────────────────────────
async function ProjectStats({ projectId }: { projectId: string }) {
  const supabase = await createClient()
  const { data } = await supabase.rpc('get_project_stats', { p_project_id: projectId })
  const stats = (data as any) ?? {}

  return (
    <div className="flex gap-5">
      {[
        ['Total leads', stats.total_leads ?? 0],
        ['Conversion', `${stats.conversion_rate ?? 0}%`],
        ['Closed Won', stats.closed_won ?? 0],
      ].map(([k, v]) => (
        <div key={k as string} className="min-w-[80px]">
          <div className="text-[11.5px] font-medium uppercase tracking-[0.04em] text-content-3">{k}</div>
          <div className="mt-0.5 text-[18px] font-semibold tracking-[-0.01em]">{String(v)}</div>
        </div>
      ))}
    </div>
  )
}

// ── Skeletons ─────────────────────────────────────────────────────────────────
function StatsSkeleton() {
  return (
    <div className="flex gap-5">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="min-w-[80px]">
          <div className="mb-1.5 h-2.5 w-16 animate-pulse rounded-full bg-[#F3F4F6]" />
          <div className="h-6 w-10 animate-pulse rounded-md bg-[#E5E7EB]" />
        </div>
      ))}
    </div>
  )
}

function FilesTabSkeleton() {
  return (
    <div className="p-4 sm:p-7">
      <div className="mb-5 flex h-[140px] items-center justify-center rounded-[12px] border-2 border-dashed border-border">
        <div className="h-4 w-40 animate-pulse rounded-full bg-[#E5E7EB]" />
      </div>
      <div className="overflow-hidden rounded-[10px] border border-border bg-white">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-[#EEF0F3] px-4 py-3.5">
            <div className="h-4 w-4 animate-pulse rounded bg-[#F3F4F6]" />
            <div className="flex-1 h-3.5 animate-pulse rounded-full bg-[#F3F4F6]" />
            <div className="h-3 w-12 animate-pulse rounded-full bg-[#F9FAFB]" />
            <div className="h-3 w-20 animate-pulse rounded-full bg-[#F9FAFB]" />
            <div className="flex gap-1">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-6 w-6 animate-pulse rounded-[5px] bg-[#F3F4F6]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="p-4 sm:p-7">
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-[10px] border border-border bg-white p-4">
            <div className="mb-2 h-3 w-20 animate-pulse rounded-full bg-[#F3F4F6]" />
            <div className="h-7 w-14 animate-pulse rounded-md bg-[#E5E7EB]" />
          </div>
        ))}
      </div>
      <div className="rounded-[10px] border border-border bg-white p-4 max-w-lg">
        <div className="mb-4 h-4 w-28 animate-pulse rounded-full bg-[#E5E7EB]" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="mb-2.5 flex items-center gap-3">
            <div className="h-3 w-[110px] animate-pulse rounded-full bg-[#F3F4F6]" />
            <div className="flex-1 h-[6px] animate-pulse rounded-full bg-[#F3F4F6]" />
            <div className="h-3 w-8 animate-pulse rounded-full bg-[#F9FAFB]" />
          </div>
        ))}
      </div>
    </div>
  )
}
