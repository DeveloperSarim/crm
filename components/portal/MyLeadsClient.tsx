'use client'

import { useState, useMemo } from 'react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import Link from 'next/link'
import { Search } from 'lucide-react'

const COMMISSION_STATUS: Record<string, { bg: string; fg: string; label: string }> = {
  na:       { bg: '#F3F4F6', fg: '#9CA3AF', label: 'N/A' },
  pending:  { bg: '#FFFBEB', fg: '#B45309', label: 'Pending' },
  approved: { bg: '#EFF6FF', fg: '#1D4ED8', label: 'Approved' },
  paid:     { bg: '#ECFDF5', fg: '#047857', label: 'Paid' },
}

const INTENT_BADGE: Record<string, { bg: string; fg: string }> = {
  buy:  { bg: '#EFF6FF', fg: '#1D4ED8' },
  rent: { bg: '#F5F3FF', fg: '#6D28D9' },
}

const PROP_TYPE_GLYPHS: Record<string, string> = {
  apartment: '▤', villa: '◮', building: '▦', land: '▱',
  office: '◫', commercial: '◧', retail: '◨', warehouse: '▭',
}

type Lead = {
  id: string
  reference_id: string | null
  full_name: string
  phone: string
  email?: string | null
  status: string
  commission_status: string | null
  budget_display: string | null
  intent: string | null
  property_type: string | null
  created_at: string
  project: { name: string; slug: string } | null
}

interface Props {
  leads: Lead[]
}

const STATUS_FILTERS = [
  ['all', 'All'],
  ['new', 'New'],
  ['follow_up', 'Follow-up'],
  ['interested', 'Interested'],
  ['site_visited', 'Site visited'],
  ['won', 'Won'],
  ['lost', 'Lost'],
] as const

/** Returns remaining lock time (30-day window from created_at) or '—' */
function formatLockEnds(createdAt: string, status: string): string {
  if (status === 'won' || status === 'lost') return '—'
  const lockEnd = new Date(createdAt).getTime() + 30 * 24 * 60 * 60 * 1000
  const diff = lockEnd - Date.now()
  if (diff <= 0) return '—'
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  return `${days}d ${hours}h`
}

export function MyLeadsClient({ leads }: Props) {
  const [intentFilter, setIntentFilter] = useState<'all' | 'buy' | 'rent'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  // Stat cards
  const stats = useMemo(() => {
    const inProgress = leads.filter(l => ['new', 'follow_up', 'site_visited', 'interested'].includes(l.status))
    const won = leads.filter(l => l.status === 'won')
    const buyInProgress = inProgress.filter(l => l.intent === 'buy').length
    const rentInProgress = inProgress.filter(l => l.intent === 'rent').length
    const paidLeads = leads.filter(l => l.commission_status === 'paid')
    return [
      { label: 'SUBMISSIONS',       value: leads.length,      sub: null,             green: false },
      { label: 'IN PROGRESS',       value: inProgress.length, sub: `${buyInProgress} buy · ${rentInProgress} rent`, green: false },
      { label: 'CLOSED WON',        value: won.length,        sub: null,             green: false },
      { label: 'COMMISSION EARNED', value: paidLeads.length > 0 ? `${paidLeads.length} paid` : '—', sub: paidLeads.length > 0 ? 'across closes' : null, green: paidLeads.length > 0 },
    ]
  }, [leads])

  // Filtered + searched leads
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return leads.filter(l => {
      const matchIntent = intentFilter === 'all' || l.intent === intentFilter
      const matchStatus = statusFilter === 'all' || l.status === statusFilter
      const matchSearch = !q ||
        l.full_name.toLowerCase().includes(q) ||
        (l.reference_id ?? '').toLowerCase().includes(q) ||
        (l.project?.name ?? '').toLowerCase().includes(q)
      return matchIntent && matchStatus && matchSearch
    })
  }, [leads, intentFilter, statusFilter, search])

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-3 text-[14px] font-medium text-[#111827]">No leads submitted yet</div>
        <div className="mb-4 text-[13px] text-[#6B7280]">Browse projects and submit your first lead</div>
        <Link
          href="/portal"
          className="rounded-[7px] bg-[#2563EB] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#1D4ED8]"
        >
          Browse projects
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Stat cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-[10px] border border-[#E5E7EB] bg-white p-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#9CA3AF]">{s.label}</div>
            <div className={`mt-1 text-[22px] font-semibold tracking-[-0.02em] ${s.green ? 'text-[#16A34A]' : 'text-[#111827]'}`}>
              {s.value}
            </div>
            {s.sub && <div className="mt-0.5 text-[11.5px] text-[#6B7280]">{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Filter toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2.5 rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2.5">
        {/* Intent label + buttons */}
        <span className="text-[12px] text-[#9CA3AF]">Intent</span>
        <div className="flex gap-1">
          {(['all', 'buy', 'rent'] as const).map(k => (
            <button
              key={k}
              onClick={() => setIntentFilter(k)}
              className={[
                'rounded-[6px] border px-2.5 py-1 text-[12px] font-medium transition-all capitalize',
                intentFilter === k
                  ? 'border-[#111827] bg-[#111827] text-white'
                  : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1D5DB] hover:text-[#374151]',
              ].join(' ')}
            >
              {k === 'all' ? 'All' : k}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-[#E5E7EB]" />

        {/* Status label + buttons */}
        <span className="text-[12px] text-[#9CA3AF]">Status</span>
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map(([k, l]) => (
            <button
              key={k}
              onClick={() => setStatusFilter(k)}
              className={[
                'rounded-[6px] border px-2.5 py-1 text-[12px] font-medium transition-all',
                statusFilter === k
                  ? 'border-[#111827] bg-[#111827] text-white'
                  : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1D5DB] hover:text-[#374151]',
              ].join(' ')}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or reference…"
            className="w-[220px] rounded-[6px] border border-[#E5E7EB] py-1.5 pl-8 pr-3 text-[12.5px] outline-none focus:border-[#2563EB]/50 focus:ring-1 focus:ring-[#2563EB]/20"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white py-16 text-center">
          <div className="text-[14px] font-medium text-[#111827]">No leads match these filters</div>
          <div className="mt-1 text-[13px] text-[#6B7280]">Try adjusting the filters or search above</div>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white sm:block">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#FAFAFB]">
                  {['Reference', 'Client', 'Project', 'Intent', 'Type', 'Budget', 'Status', 'Submitted', 'Lock ends', 'Commission'].map(h => (
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
                {filtered.map(lead => {
                  const cs = COMMISSION_STATUS[lead.commission_status ?? 'na']
                  const intentStyle = INTENT_BADGE[lead.intent ?? '']
                  const lockEnds = formatLockEnds(lead.created_at, lead.status)
                  const lockIsActive = lockEnds !== '—'
                  const commissionEarned = lead.commission_status === 'paid'
                  return (
                    <tr key={lead.id} className="border-t border-[#EEF0F3] hover:bg-[#FAFAFB]">
                      {/* Reference */}
                      <td className="px-3.5 py-3 font-mono text-[11.5px] text-[#6B7280]">
                        {lead.reference_id ?? '—'}
                      </td>
                      {/* Client */}
                      <td className="px-3.5 py-3">
                        <div className="font-medium text-[#111827]">{lead.full_name}</div>
                      </td>
                      {/* Project */}
                      <td className="px-3.5 py-3 text-[#6B7280]">
                        {lead.project?.name ?? '—'}
                      </td>
                      {/* Intent */}
                      <td className="px-3.5 py-3">
                        {lead.intent && intentStyle ? (
                          <span
                            className="inline-block rounded-[4px] px-2 py-0.5 text-[11px] font-medium capitalize"
                            style={{ background: intentStyle.bg, color: intentStyle.fg }}
                          >
                            {lead.intent}
                          </span>
                        ) : <span className="text-[#9CA3AF]">—</span>}
                      </td>
                      {/* Type */}
                      <td className="px-3.5 py-3">
                        {lead.property_type ? (
                          <span className="inline-flex items-center gap-1 rounded-[4px] border border-[#EEF0F3] bg-[#FAFAFB] px-2 py-0.5 text-[11px] text-[#6B7280]">
                            <span className="font-mono opacity-60">{PROP_TYPE_GLYPHS[lead.property_type] ?? '▤'}</span>
                            <span className="capitalize">{lead.property_type}</span>
                          </span>
                        ) : <span className="text-[#9CA3AF]">—</span>}
                      </td>
                      {/* Budget */}
                      <td className="px-3.5 py-3 font-tabular text-[#111827]">
                        {lead.budget_display ?? '—'}
                      </td>
                      {/* Status */}
                      <td className="px-3.5 py-3">
                        <StatusBadge kind={lead.status} />
                      </td>
                      {/* Submitted */}
                      <td className="px-3.5 py-3 text-[#9CA3AF]">
                        {new Date(lead.created_at).toLocaleDateString('en-SA', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </td>
                      {/* Lock ends */}
                      <td className={`px-3.5 py-3 text-[12px] ${lockIsActive ? 'font-mono text-[#6B7280]' : 'text-[#9CA3AF]'}`}>
                        {lockEnds}
                      </td>
                      {/* Commission */}
                      <td className={`px-3.5 py-3 ${commissionEarned ? 'font-medium text-[#047857]' : 'text-[#9CA3AF]'}`}>
                        <span
                          className="inline-block rounded-[4px] px-2 py-0.5 text-[11px] font-medium"
                          style={{ background: cs.bg, color: cs.fg }}
                        >
                          {cs.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Table footer */}
            <div className="flex items-center border-t border-[#EEF0F3] bg-[#FAFAFB] px-3.5 py-2.5 text-[12px] text-[#9CA3AF]">
              <span>Showing {filtered.length} of {leads.length}</span>
              <div className="flex-1" />
              {leads.filter(l => l.commission_status === 'paid').length > 0 && (
                <span>
                  Commission paid on{' '}
                  <span className="font-medium text-[#047857]">
                    {leads.filter(l => l.commission_status === 'paid').length} lead{leads.filter(l => l.commission_status === 'paid').length !== 1 ? 's' : ''}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 sm:hidden">
            {filtered.map(lead => {
              const cs = COMMISSION_STATUS[lead.commission_status ?? 'na']
              const lockEnds = formatLockEnds(lead.created_at, lead.status)
              return (
                <div key={lead.id} className="rounded-[10px] border border-[#E5E7EB] bg-white p-4">
                  <div className="mb-2.5 flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-[14px] text-[#111827]">{lead.full_name}</div>
                      <div className="mt-0.5 font-mono text-[11.5px] text-[#9CA3AF]">
                        {lead.reference_id ?? lead.phone}
                      </div>
                    </div>
                    <StatusBadge kind={lead.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[12.5px]">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.04em] text-[#9CA3AF]">Project</div>
                      <div className="mt-0.5 text-[#111827]">{lead.project?.name ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.04em] text-[#9CA3AF]">Budget</div>
                      <div className="mt-0.5 font-tabular text-[#111827]">{lead.budget_display ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.04em] text-[#9CA3AF]">Lock ends</div>
                      <div className={`mt-0.5 ${lockEnds !== '—' ? 'font-mono text-[12px] text-[#6B7280]' : 'text-[#9CA3AF]'}`}>
                        {lockEnds}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.04em] text-[#9CA3AF]">Commission</div>
                      <div className="mt-0.5">
                        <span
                          className="inline-block rounded-[4px] px-2 py-0.5 text-[11px] font-medium"
                          style={{ background: cs.bg, color: cs.fg }}
                        >
                          {cs.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}
