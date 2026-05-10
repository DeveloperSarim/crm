import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Avatar } from '@/components/shared/Avatar'
import { LeadDetailActions } from '@/components/leads/LeadDetailActions'
import { formatDate, formatRelative } from '@/lib/utils/formatters'
import Link from 'next/link'
import { AddNoteForm } from '@/components/leads/AddNoteForm'
import { Phone, Mail, MapPin, Calendar, ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string; id: string }>
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'interested', label: 'Interested' },
  { value: 'site_visit', label: 'Site Visit' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closed_won', label: 'Closed Won' },
  { value: 'closed_lost', label: 'Closed Lost' },
  { value: 'on_hold', label: 'On Hold' },
]

const PROPERTY_GLYPHS: Record<string, string> = {
  apartment: '▤', villa: '◮', building: '▦', land: '▱',
  office: '◫', commercial: '◧', retail: '◨', warehouse: '▭',
}

export default async function LeadDetailPage({ params }: PageProps) {
  const { slug, id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isHead = (profile as any)?.role === 'head'

  const { data: lead } = await supabase
    .from('leads')
    .select(`
      *,
      project:projects(name, slug),
      source:lead_sources(name),
      assigned:profiles!leads_assigned_to_fkey(id, full_name),
      submitter:profiles!leads_submitted_by_fkey(full_name)
    `)
    .eq('id', id)
    .single()

  if (!lead) notFound()

  // RLS handles access — if non-head user doesn't own it, it won't be returned

  const { data: notes } = await supabase
    .from('lead_notes')
    .select('*, author:profiles(full_name)')
    .eq('lead_id', id)
    .order('created_at', { ascending: false })

  const { data: history } = await supabase
    .from('lead_status_history')
    .select('*, changer:profiles(full_name)')
    .eq('lead_id', id)
    .order('changed_at', { ascending: false })
    .limit(10)

  const { data: teamMembers } = isHead
    ? await supabase.from('profiles').select('id, full_name').eq('role', 'sales_member').eq('is_active', true).order('full_name')
    : { data: [] }

  const assigned = Array.isArray((lead as any).assigned)
    ? (lead as any).assigned[0]
    : (lead as any).assigned

  const source = Array.isArray((lead as any).source)
    ? (lead as any).source[0]
    : (lead as any).source

  const project = Array.isArray((lead as any).project)
    ? (lead as any).project[0]
    : (lead as any).project

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar
        crumbs={['Workspace', 'Projects', project?.name ?? slug, lead.full_name]}
        action={
          <Link href={`/projects/${slug}?tab=leads`}
            className="inline-flex items-center gap-1.5 rounded-[6px] border border-border bg-white px-2.5 py-[5px] text-[13px] font-medium text-content hover:bg-surface-2">
            <ArrowLeft size={13} /> Back to leads
          </Link>
        }
      />

      <div className="flex flex-1 flex-col overflow-hidden sm:flex-row">
        {/* Main content */}
        <div className="flex-1 overflow-auto p-4 sm:p-7">
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-start gap-3 sm:gap-4">
            <Avatar name={lead.full_name} size={44} />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-[18px] font-semibold tracking-[-0.02em] sm:text-[22px]">{lead.full_name}</h1>
                <StatusBadge kind={lead.status} />
                {(lead as any).reference_id && (
                  <span className="font-tabular text-[12px] text-content-3">{(lead as any).reference_id}</span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-4 text-[13px] text-content-2">
                <a href={`tel:${lead.phone}`} className="flex items-center gap-1.5 hover:text-brand">
                  <Phone size={12} className="text-content-3" /> {lead.phone}
                </a>
                {(lead as any).email && (
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 hover:text-brand">
                    <Mail size={12} className="text-content-3" /> {(lead as any).email}
                  </a>
                )}
                {(lead as any).address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-content-3" /> {(lead as any).address}
                  </span>
                )}
              </div>
            </div>

            {/* Status update for ALL users; assign only for heads */}
            <LeadDetailActions
              lead={lead as any}
              teamMembers={isHead ? (teamMembers ?? []) : []}
              projectSlug={slug}
              statusOptions={STATUS_OPTIONS}
              isHead={isHead}
            />
          </div>

          {/* Details grid */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: 'Intent', value: (lead as any).intent ? ((lead as any).intent === 'buy' ? 'Buy' : 'Rent') : '—' },
              { label: 'Property Type', value: (lead as any).property_type ? `${PROPERTY_GLYPHS[(lead as any).property_type] ?? ''} ${(lead as any).property_type}` : '—' },
              { label: 'Budget', value: (lead as any).budget_display ?? '—' },
              { label: 'Source', value: source?.name ?? '—' },
              { label: 'Assigned to', value: assigned?.full_name ?? 'Unassigned' },
              { label: 'Follow-up', value: (lead as any).follow_up_date ? formatDate((lead as any).follow_up_date) : '—' },
            ].map(item => (
              <div key={item.label} className="rounded-[8px] border border-border bg-white p-3.5">
                <div className="mb-0.5 text-[11px] font-medium uppercase tracking-[0.04em] text-content-3">{item.label}</div>
                <div className="text-[13.5px] font-medium text-content">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Query */}
          {(lead as any).query && (
            <div className="mb-6 rounded-[10px] border border-border bg-white p-4">
              <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.04em] text-content-3">Query / Requirements</h3>
              <p className="text-[13.5px] leading-relaxed text-content-2">{(lead as any).query}</p>
            </div>
          )}

          {/* Notes */}
          <div className="rounded-[10px] border border-border bg-white">
            <div className="flex items-center border-b border-border px-4 py-3">
              <h3 className="text-[13px] font-semibold">Notes</h3>
              <span className="ml-2 text-[12px] text-content-3">{notes?.length ?? 0}</span>
            </div>
            <AddNoteForm leadId={id} projectSlug={slug} />
            <div className="divide-y divide-border/60">
              {(notes ?? []).map(note => (
                <div key={(note as any).id} className="px-4 py-3">
                  <div className="mb-1 flex items-center gap-2">
                    <Avatar name={(note as any).author?.full_name ?? 'Unknown'} size={18} />
                    <span className="text-[12.5px] font-medium">{(note as any).author?.full_name}</span>
                    <span className="ml-auto text-[11.5px] text-content-3">{formatRelative((note as any).created_at)}</span>
                  </div>
                  <p className="text-[13px] text-content-2">{(note as any).content}</p>
                </div>
              ))}
              {(!notes || notes.length === 0) && (
                <div className="py-6 text-center text-[12.5px] text-content-3">No notes yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar — hidden on mobile */}
        <aside className="hidden w-64 flex-none overflow-auto border-l border-border bg-[#FAFAFB] p-4 sm:block">
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-content-3">Activity</h3>
          <div className="space-y-3">
            {(history ?? []).map(h => (
              <div key={(h as any).id} className="text-[12px]">
                <span className="text-content-3">{formatRelative((h as any).changed_at)}</span>
                <div className="mt-0.5 text-content-2">
                  Status → <span className="font-medium text-content">{(h as any).new_status.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
            <div className="text-[12px]">
              <span className="text-content-3">{formatRelative((lead as any).created_at)}</span>
              <div className="mt-0.5 text-content-2">Lead created</div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-content-3">Lead score</h3>
            {(lead as any).score != null ? (
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F3F4F6]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(lead as any).score}%`,
                      background: (lead as any).score >= 85 ? '#10B981' : (lead as any).score >= 65 ? '#F59E0B' : '#EF4444',
                    }}
                  />
                </div>
                <span className="font-tabular text-[13px] font-medium">{(lead as any).score}</span>
              </div>
            ) : (
              <span className="text-[12.5px] text-content-3">Not scored</span>
            )}
          </div>

          {(lead as any).follow_up_date && (
            <div className="mt-6">
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-content-3">Follow-up</h3>
              <div className="flex items-center gap-1.5 text-[13px]">
                <Calendar size={12} className="text-content-3" />
                {formatDate((lead as any).follow_up_date)}
              </div>
              {(lead as any).follow_up_notes && (
                <p className="mt-1 text-[12px] text-content-2">{(lead as any).follow_up_notes}</p>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

// AddNoteForm is imported from @/components/leads/AddNoteForm
