'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { Search, ChevronDown, Plus, MoreHorizontal, UserPlus, Loader2, Trash2 } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { AssignModal } from './AssignModal'
import { ExportButton } from './ExportButton'
import { assignLead, bulkAssignLeads, bulkDeleteLeads, updateLeadStatus } from '@/lib/actions/leads'
import { formatRelative } from '@/lib/utils/formatters'
import { cn } from '@/lib/utils/cn'

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'interested', label: 'Interested' },
  { value: 'site_visit', label: 'Site Visit' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closed_won', label: '✓ Won' },
  { value: 'closed_lost', label: '✗ Lost' },
  { value: 'on_hold', label: 'On Hold' },
]

const PROPERTY_TYPES = [
  { id: 'apartment', label: 'Apartment', glyph: '▤' },
  { id: 'villa', label: 'Villa', glyph: '◮' },
  { id: 'building', label: 'Building', glyph: '▦' },
  { id: 'land', label: 'Land / Plot', glyph: '▱' },
  { id: 'office', label: 'Office', glyph: '◫' },
  { id: 'commercial', label: 'Commercial', glyph: '◧' },
  { id: 'retail', label: 'Retail', glyph: '◨' },
  { id: 'warehouse', label: 'Warehouse', glyph: '▭' },
] as const

type PropertyTypeId = typeof PROPERTY_TYPES[number]['id']

interface Lead {
  id: string
  reference_id: string | null
  full_name: string
  phone: string
  status: string
  intent: string | null
  property_type: string | null
  budget_display: string | null
  score: number | null
  follow_up_date: string | null
  created_at: string
  updated_at: string
  // Supabase joins return arrays for foreign key relationships
  source: { id: string; name: string }[] | { id: string; name: string } | null
  assigned: { id: string; full_name: string }[] | { id: string; full_name: string } | null
}

interface LeadTableClientProps {
  leads: Lead[]
  teamMembers: { id: string; full_name: string }[]
  projectSlug: string
  isHead: boolean
}

function IntentBadge({ intent }: { intent: string | null }) {
  if (!intent) return null
  const isBuy = intent === 'buy'
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium',
      isBuy ? 'bg-[#F3F4F6] text-content' : 'bg-[#EFF4FE] text-[#1D4ED8]'
    )}>
      <span className={cn('h-[5px] w-[5px] rounded-full', isBuy ? 'bg-[#111827]' : 'bg-brand')} />
      {isBuy ? 'Buy' : 'Rent'}
    </span>
  )
}

function TypePill({ type }: { type: string | null }) {
  if (!type) return null
  const pt = PROPERTY_TYPES.find(x => x.id === type)
  if (!pt) return null
  return (
    <span className="inline-flex items-center gap-1 rounded border border-[#EEF0F3] bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-content-2">
      <span className="font-mono opacity-60">{pt.glyph}</span>
      {pt.label}
    </span>
  )
}

function ScoreCell({ score }: { score: number | null }) {
  if (score == null) return <span className="text-content-3">—</span>
  const color = score >= 85 ? '#10B981' : score >= 65 ? '#F59E0B' : '#EF4444'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-9 overflow-hidden rounded-full bg-[#F3F4F6]">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="w-5 font-tabular text-[12px] text-content-2">{score}</span>
    </div>
  )
}

export function LeadTableClient({ leads: initialLeads, teamMembers, projectSlug, isHead }: LeadTableClientProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [intentFilter, setIntentFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [assignTarget, setAssignTarget] = useState<Lead | null>(null)
  const [bulkAssigning, setBulkAssigning] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const filtered = useMemo(() => {
    return leads.filter(l => {
      if (search && !l.full_name.toLowerCase().includes(search.toLowerCase()) &&
          !l.phone.includes(search)) return false
      if (statusFilter !== 'all' && l.status !== statusFilter) return false
      if (intentFilter !== 'all' && l.intent !== intentFilter) return false
      if (typeFilter !== 'all' && l.property_type !== typeFilter) return false
      return true
    })
  }, [leads, search, statusFilter, intentFilter, typeFilter])

  const allSelected = filtered.length > 0 && filtered.every(l => selected.has(l.id))

  function toggleAll() {
    if (allSelected) {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(l => next.delete(l.id))
        return next
      })
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(l => next.add(l.id))
        return next
      })
    }
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleAssign(assigneeId: string) {
    if (bulkAssigning) {
      await bulkAssignLeads(Array.from(selected), assigneeId, projectSlug)
      setSelected(new Set())
    } else if (assignTarget) {
      await assignLead(assignTarget.id, assigneeId, projectSlug)
      setAssignTarget(null)
    }
    setBulkAssigning(false)
  }

  async function handleBulkDelete() {
    if (!confirm(`Permanently delete ${selected.size} lead${selected.size !== 1 ? 's' : ''}? This cannot be undone.`)) return
    setBulkDeleting(true)
    const ids = Array.from(selected)
    const result = await bulkDeleteLeads(ids, projectSlug)
    if (result?.error) {
      alert(result.error)
    } else {
      // Optimistically remove from list
      setLeads(prev => prev.filter(l => !selected.has(l.id)))
      setSelected(new Set())
    }
    setBulkDeleting(false)
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-4 pt-3.5 sm:px-7">
        <div className="relative">
          <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-content-3" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${leads.length} leads…`}
            className="w-60 rounded-[6px] border border-border py-[5px] pl-7 pr-2.5 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="inline-flex items-center gap-1.5 rounded-[6px] border border-border bg-white px-2.5 py-[5px] text-[13px] font-medium text-content outline-none hover:bg-surface-2"
        >
          <option value="all">Status: All</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="interested">Interested</option>
          <option value="site_visit">Site Visit</option>
          <option value="negotiation">Negotiation</option>
          <option value="closed_won">Closed Won</option>
          <option value="closed_lost">Closed Lost</option>
          <option value="on_hold">On Hold</option>
        </select>

        {/* Intent toggle */}
        <div className="inline-flex gap-0.5 rounded-[8px] border border-border bg-surface-2 p-[3px]">
          {[['all', 'All'], ['buy', 'Buy'], ['rent', 'Rent']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setIntentFilter(id)}
              className={cn(
                'rounded-[5px] px-2.5 py-1 text-[12px] transition-all',
                intentFilter === id
                  ? 'bg-white font-medium text-content shadow-[0_1px_2px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.04)]'
                  : 'text-content-2'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {selected.size > 0 && isHead && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setBulkAssigning(true)}
              className="inline-flex items-center gap-1.5 rounded-[6px] border border-brand/30 bg-brand/5 px-2.5 py-[5px] text-[13px] font-medium text-brand"
            >
              <UserPlus size={12} /> Assign {selected.size}
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="inline-flex items-center gap-1.5 rounded-[6px] border border-red-200 bg-red-50 px-2.5 py-[5px] text-[13px] font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
            >
              {bulkDeleting
                ? <Loader2 size={12} className="animate-spin" />
                : <Trash2 size={12} />
              }
              Delete {selected.size}
            </button>
          </div>
        )}

        <div className="flex-1" />
        <span className="text-[12px] text-content-3">
          {filtered.length} of {leads.length}
        </span>
        <ExportButton projectSlug={projectSlug} label="Export" />
        <Link
          href={`/projects/${projectSlug}/leads/new`}
          className="inline-flex items-center gap-1.5 rounded-[6px] bg-brand px-2.5 py-[5px] text-[13px] font-medium text-white shadow-[0_1px_0_rgba(0,0,0,0.04)]"
        >
          <Plus size={13} /> Add lead
        </Link>
      </div>

      {/* Property type chips */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 pt-2.5 sm:px-7">
        <span className="mr-1 text-[11px] font-medium uppercase tracking-[0.04em] text-content-3">Type</span>
        <button
          onClick={() => setTypeFilter('all')}
          className={cn(
            'rounded-[5px] border px-2 py-0.5 text-[11.5px] font-medium transition-all',
            typeFilter === 'all'
              ? 'border-[#111827] bg-[#111827] text-white'
              : 'border-border bg-white text-content hover:bg-surface-2'
          )}
        >
          All
        </button>
        {PROPERTY_TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => setTypeFilter(typeFilter === t.id ? 'all' : t.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-[5px] border px-2 py-0.5 text-[11.5px] transition-all',
              typeFilter === t.id
                ? 'border-[#111827] bg-[#111827] font-medium text-white'
                : 'border-border bg-white text-content hover:bg-surface-2'
            )}
          >
            <span className="font-mono opacity-65">{t.glyph}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="px-4 pb-8 pt-3 sm:px-7">
        <div className="overflow-hidden rounded-[10px] border border-border bg-white">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-[13px]" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 36 }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: 130 }} />
              <col style={{ width: 60 }} />
              <col style={{ width: 105 }} />
              <col style={{ width: 115 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 88 }} />
              <col style={{ width: 95 }} />
              <col style={{ width: 72 }} />
              <col style={{ width: 32 }} />
            </colgroup>
            <thead>
              <tr className="bg-[#FAFAFB]">
                <th className="px-3 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-border"
                  />
                </th>
                {['Name', 'Phone', 'Intent', 'Type', 'Source', 'Owner', 'Status', 'Score', 'Budget', 'Last', ''].map((h, i) => (
                  <th key={i} className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-[0.04em] text-content-3">
                    {h && (
                      <span className="inline-flex items-center gap-1">
                        {h}
                        {h && <ChevronDown size={9} className="opacity-40" />}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-[13px] text-content-3">
                    {leads.length === 0 ? (
                      <>No leads yet — <Link href={`/projects/${projectSlug}/leads/new`} className="text-brand hover:underline">add the first one</Link></>
                    ) : 'No leads match current filters'}
                  </td>
                </tr>
              ) : (
                filtered.map(lead => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    isHead={isHead}
                    selected={selected.has(lead.id)}
                    onSelect={() => toggleOne(lead.id)}
                    onAssign={() => setAssignTarget(lead)}
                    projectSlug={projectSlug}
                  />
                ))
              )}
            </tbody>
          </table>
          </div>
          <div className="flex items-center border-t border-[#EEF0F3] bg-[#FAFAFB] px-3.5 py-2 text-[12px] text-content-3">
            <span>Showing {filtered.length} of {leads.length}</span>
            <div className="flex-1" />
            {selected.size > 0 && (
              <span className="text-content-2">{selected.size} selected</span>
            )}
          </div>
        </div>
      </div>

      {/* Assign modal */}
      {(assignTarget || bulkAssigning) && (
        <AssignModal
          lead={assignTarget ?? null}
          bulkCount={bulkAssigning ? selected.size : 0}
          teamMembers={teamMembers}
          onAssign={handleAssign}
          onClose={() => { setAssignTarget(null); setBulkAssigning(false) }}
        />
      )}
    </div>
  )
}

function LeadRow({
  lead, isHead, selected, onSelect, onAssign, projectSlug,
}: {
  lead: Lead
  isHead: boolean
  selected: boolean
  onSelect: () => void
  onAssign: () => void
  projectSlug: string
}) {
  const [status, setStatus] = useState(lead.status)
  const [isPending, startTransition] = useTransition()

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value
    setStatus(newStatus)
    startTransition(() => updateLeadStatus(lead.id, newStatus, projectSlug))
  }

  return (
    <tr className="border-t border-[#EEF0F3] hover:bg-[#FAFAFB]">
      <td className="px-3 py-2">
        <input type="checkbox" checked={selected} onChange={onSelect} className="rounded border-border" />
      </td>
      <td className="px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar name={lead.full_name} size={22} />
          <div className="min-w-0">
            <Link
              href={`/projects/${projectSlug}/leads/${lead.id}`}
              className="block overflow-hidden text-ellipsis whitespace-nowrap font-medium text-content hover:text-brand"
            >
              {lead.full_name}
            </Link>
            {lead.reference_id && (
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[11.5px] text-content-3">
                {lead.reference_id}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="px-3 py-2">
        <a
          href={`tel:${lead.phone}`}
          className="font-tabular text-[12.5px] text-content-2 hover:text-brand transition-colors"
          onClick={e => e.stopPropagation()}
        >
          {lead.phone}
        </a>
      </td>
      <td className="px-3 py-2"><IntentBadge intent={lead.intent} /></td>
      <td className="px-3 py-2"><TypePill type={lead.property_type} /></td>
      <td className="px-3 py-2 text-content-2">{(lead.source as any)?.name ?? '—'}</td>
      <td className="px-3 py-2">
        {(lead.assigned as any)?.full_name ? (
          <button
            onClick={isHead ? onAssign : undefined}
            className={cn(
              'inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[13px] text-content border border-transparent transition-colors',
              isHead && 'hover:border-border'
            )}
          >
            <Avatar name={(lead.assigned as any).full_name} size={18} />
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">{(lead.assigned as any).full_name}</span>
          </button>
        ) : isHead ? (
          <button onClick={onAssign} className="inline-flex items-center gap-1 rounded border border-dashed border-border px-1.5 py-0.5 text-[12px] text-content-3 hover:border-content-3 hover:text-content-2">
            <UserPlus size={11} /> Assign
          </button>
        ) : (
          <span className="text-content-3">Unassigned</span>
        )}
      </td>

      {/* ── Inline status dropdown ── */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          {isPending && <Loader2 size={11} className="animate-spin text-content-3 flex-none" />}
          <select
            value={status}
            onChange={handleStatusChange}
            disabled={isPending}
            onClick={e => e.stopPropagation()}
            className="appearance-none rounded-[5px] border border-transparent bg-transparent py-0.5 pl-0 pr-4 text-[12.5px] font-medium text-content outline-none hover:border-border hover:bg-white hover:px-2 focus:border-brand/40 focus:bg-white focus:px-2 disabled:opacity-60 transition-all cursor-pointer"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </td>

      <td className="px-3 py-2"><ScoreCell score={lead.score} /></td>
      <td className="px-3 py-2 font-tabular text-content-2">{lead.budget_display ?? '—'}</td>
      <td className="px-3 py-2 text-content-3">{formatRelative(lead.updated_at)}</td>
      <td className="px-3 py-2">
        <Link href={`/projects/${projectSlug}/leads/${lead.id}`} className="text-content-3 hover:text-content-2">
          <MoreHorizontal size={14} />
        </Link>
      </td>
    </tr>
  )
}
