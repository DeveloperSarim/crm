'use client'

import { useState, useTransition } from 'react'
import { UserPlus, Loader2 } from 'lucide-react'
import { AssignModal } from './AssignModal'
import { assignLead, updateLeadStatus } from '@/lib/actions/leads'

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  contacted: 'bg-sky-50 text-sky-700 border-sky-200',
  interested: 'bg-purple-50 text-purple-700 border-purple-200',
  site_visit: 'bg-amber-50 text-amber-700 border-amber-200',
  negotiation: 'bg-orange-50 text-orange-700 border-orange-200',
  closed_won: 'bg-green-50 text-green-700 border-green-200',
  closed_lost: 'bg-red-50 text-red-700 border-red-200',
  on_hold: 'bg-gray-50 text-gray-600 border-gray-200',
}

interface Props {
  lead: { id: string; full_name: string; status: string; assigned?: unknown }
  teamMembers: { id: string; full_name: string }[]
  projectSlug: string
  statusOptions: { value: string; label: string }[]
  isHead: boolean
}

export function LeadDetailActions({ lead, teamMembers, projectSlug, statusOptions, isHead }: Props) {
  const [assignOpen, setAssignOpen] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(lead.status)
  const [isPending, startTransition] = useTransition()

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value
    setCurrentStatus(newStatus) // optimistic update
    startTransition(() => {
      updateLeadStatus(lead.id, newStatus, projectSlug)
    })
  }

  async function handleAssign(assigneeId: string) {
    await assignLead(lead.id, assigneeId, projectSlug)
    setAssignOpen(false)
  }

  const colorClass = STATUS_COLORS[currentStatus] ?? 'bg-gray-50 text-gray-600 border-gray-200'

  return (
    <div className="flex items-center gap-2">
      {/* Status dropdown — visible to all users */}
      <div className="relative flex items-center gap-1.5">
        {isPending && <Loader2 size={12} className="animate-spin text-content-3" />}
        <select
          value={currentStatus}
          onChange={handleStatusChange}
          disabled={isPending}
          className={`appearance-none rounded-[6px] border px-2.5 py-[5px] text-[12.5px] font-medium outline-none transition-colors cursor-pointer disabled:opacity-60 ${colorClass}`}
        >
          {statusOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Assign — only heads */}
      {isHead && (
        <button
          onClick={() => setAssignOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-[6px] border border-border bg-white px-2.5 py-[5px] text-[13px] font-medium text-content hover:bg-surface-2"
        >
          <UserPlus size={12} /> Assign
        </button>
      )}

      {assignOpen && (
        <AssignModal
          lead={lead}
          teamMembers={teamMembers}
          onAssign={handleAssign}
          onClose={() => setAssignOpen(false)}
        />
      )}
    </div>
  )
}
