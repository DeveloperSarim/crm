import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser, getUserProfile } from '@/lib/supabase/cached'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import Link from 'next/link'
import { Plus, MapPin, Building2, Users } from 'lucide-react'
import type { Project } from '@/lib/types/database.types'
import { PinButton } from '@/components/projects/PinButton'

interface PageProps {
  searchParams: Promise<{ tab?: string }>
}

// ── Page shell renders instantly, grid streams in via Suspense ────────────
export default async function ProjectsPage({ searchParams }: PageProps) {
  const { tab = 'all' } = await searchParams
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const profile = await getUserProfile(user.id)
  const isHead = profile?.role === 'head'

  const TABS = [
    { label: 'All', status: 'all' },
    { label: 'Active', status: 'active' },
    { label: 'Pre-sale', status: 'presale' },
    { label: 'Paused', status: 'paused' },
    { label: 'Archived', status: 'archived' },
  ]

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Topbar — renders with zero DB calls */}
      <Topbar
        crumbs={['Workspace', 'Projects']}
        action={
          isHead ? (
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-1.5 rounded-[6px] bg-brand px-2.5 py-[5px] text-[13px] font-medium text-white shadow-[0_1px_0_rgba(0,0,0,0.04)]"
            >
              <Plus size={13} /> New project
            </Link>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-auto p-[16px_16px_24px] sm:p-[22px_28px_32px]">
        {/* Title row */}
        <div className="mb-4 flex items-center">
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] sm:text-[22px]">Projects</h1>
          <div className="flex-1" />
        </div>

        {/* Tabs — static, no DB needed */}
        <div className="mb-4 flex gap-4 border-b border-border">
          {TABS.map(t => {
            const isActive = tab === t.status
            return (
              <Link
                key={t.status}
                href={`/projects${t.status === 'all' ? '' : `?tab=${t.status}`}`}
                className="flex items-center gap-1.5 pb-[9px] text-[13px]"
                style={{
                  color: isActive ? '#111827' : '#6B7280',
                  fontWeight: isActive ? 500 : 400,
                  borderBottom: isActive ? '2px solid #111827' : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                {t.label}
              </Link>
            )
          })}
        </div>

        {/* Grid — streams in while Topbar + Tabs are already visible */}
        <Suspense fallback={<ProjectsGridSkeleton />}>
          <ProjectsGrid tab={tab} userId={user.id} />
        </Suspense>
      </div>
    </div>
  )
}

// ── Data-fetching component (runs async, streams in) ─────────────────────
async function ProjectsGrid({ tab, userId }: { tab: string; userId: string }) {
  const supabase = await createClient()

  const [{ data: projects }, { data: pinnedRows }] = await Promise.all([
    supabase
      .from('projects')
      .select('*, created_by_profile:profiles!projects_created_by_fkey(full_name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('user_pinned_projects')
      .select('project_id')
      .eq('user_id', userId),
  ])

  const pinnedIds = new Set((pinnedRows ?? []).map((r: any) => r.project_id))

  const filtered = tab === 'all'
    ? (projects ?? [])
    : (projects ?? []).filter(p => p.status === tab)

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-2 text-content-3">
          <Building2 size={20} />
        </div>
        <div className="text-[14px] font-semibold">
          {tab === 'all' ? 'No projects yet' : `No ${tab} projects`}
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map(project => (
        <ProjectCard key={project.id} project={project} isPinned={pinnedIds.has(project.id)} />
      ))}
    </div>
  )
}

function ProjectsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="overflow-hidden rounded-[12px] border border-border bg-white">
          <div className="h-[150px] animate-pulse bg-[#F3F4F6]" />
          <div className="p-3">
            <div className="mb-2 h-4 w-3/4 animate-pulse rounded-full bg-[#E5E7EB]" />
            <div className="mb-3 h-3 w-1/2 animate-pulse rounded-full bg-[#F3F4F6]" />
            <div className="h-3 w-full animate-pulse rounded-full bg-[#F9FAFB]" />
          </div>
        </div>
      ))}
    </div>
  )
}

function ProjectCard({ project, isPinned }: { project: Project; isPinned: boolean }) {
  const hue = project.color_hue ?? 210
  return (
    <div className="group relative overflow-hidden rounded-[12px] border border-border bg-white transition-shadow hover:shadow-[0_4px_14px_rgba(17,24,39,0.06)]">
      <PinButton projectId={project.id} isPinned={isPinned} />

      <Link href={`/projects/${project.slug}`} className="block">
        <div className="relative h-[150px] overflow-hidden">
          {project.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.cover_image_url} alt={project.name} className="h-full w-full object-cover" />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background: `oklch(0.94 0.012 ${hue})`,
                backgroundImage: `repeating-linear-gradient(45deg, oklch(0.91 0.018 ${hue}) 0, oklch(0.91 0.018 ${hue}) 6px, transparent 0, transparent 50%)`,
                backgroundSize: '10px 10px',
              }}
            />
          )}
          <div className="absolute left-2.5 top-2.5">
            <StatusBadge kind={project.status} />
          </div>
        </div>

        <div className="p-3 pb-3.5">
          <div className="mb-0.5 text-[14px] font-semibold tracking-[-0.01em]">{project.name}</div>
          {project.city && (
            <div className="mb-3 flex items-center gap-1 text-[12px] text-content-2">
              <MapPin size={11} className="text-content-3" />
              {project.city}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {[
              ['Units', project.total_units ?? '—'],
              ['Status', project.status],
            ].map(([k, v]) => (
              <div key={k as string}>
                <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-content-3">{k}</div>
                <div className="mt-0.5 font-tabular text-[13px] font-medium text-content capitalize">{v}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5">
            <span className="text-[12px] text-content-2">
              {Array.isArray(project.pricing_details) && (project.pricing_details as any[]).length > 0
                ? `${(project.pricing_details as any[])[0]?.price ?? ''}`
                : 'Price on request'}
            </span>
            <Users size={13} className="text-content-3" />
          </div>
        </div>
      </Link>
    </div>
  )
}
