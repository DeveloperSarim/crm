'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'

interface AssignModalProps {
  lead: { id: string; full_name: string; assigned?: unknown } | null
  bulkCount?: number
  teamMembers: { id: string; full_name: string }[]
  onAssign: (assigneeId: string) => Promise<void>
  onClose: () => void
}

export function AssignModal({ lead, bulkCount = 0, teamMembers, onAssign, onClose }: AssignModalProps) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(
    (lead?.assigned as any)?.id ?? null
  )
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const filtered = teamMembers.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleApply() {
    if (!selected) return
    setLoading(true)
    await onAssign(selected)
    setLoading(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,24,39,0.18)] backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-80 overflow-hidden rounded-[10px] border border-border bg-white shadow-[0_20px_50px_rgba(17,24,39,0.18),0_4px_12px_rgba(17,24,39,0.06)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-1.5 px-3 pb-1 pt-2.5">
          <span className="text-[12px] text-content-3">Assign</span>
          {bulkCount > 0 ? (
            <span className="text-[12.5px] font-medium">{bulkCount} leads</span>
          ) : (
            <span className="text-[12.5px] font-medium">{lead?.full_name}</span>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="text-content-3 hover:text-content-2">
            <X size={13} />
          </button>
        </div>

        {/* Search */}
        <div className="px-1.5 py-1">
          <input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search teammates…"
            className="w-full rounded-[6px] border border-border px-2 py-1.5 text-[13px] outline-none focus:border-brand/50"
          />
        </div>

        {/* Team list */}
        <div className="max-h-72 overflow-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-center text-[12px] text-content-3">No teammates found</div>
          ) : (
            filtered.map(member => (
              <button
                key={member.id}
                onClick={() => setSelected(member.id)}
                className="flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-1.5 mx-1 text-left transition-colors hover:bg-surface-2"
                style={{ width: 'calc(100% - 8px)' }}
              >
                <Avatar name={member.full_name} size={26} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium">{member.full_name}</div>
                  <div className="text-[11.5px] text-content-3">Sales member</div>
                </div>
                {selected === member.id && (
                  <Check size={14} className="text-brand flex-none" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-3 py-2">
          <span className="text-[11.5px] text-content-3">
            {selected ? '1 selected' : 'Select a teammate'}
          </span>
          <button
            onClick={handleApply}
            disabled={!selected || loading}
            className="rounded-[6px] bg-brand px-2.5 py-1 text-[12px] font-medium text-white disabled:opacity-50"
          >
            {loading ? 'Assigning…' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  )
}
