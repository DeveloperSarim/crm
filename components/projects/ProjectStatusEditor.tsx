'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import { updateProjectStatus } from '@/lib/actions/projects'

const STATUS_OPTIONS = [
  { value: 'active',    label: 'Active',     dot: '#10B981' },
  { value: 'presale',   label: 'Pre-sale',   dot: '#3B82F6' },
  { value: 'paused',    label: 'Paused',     dot: '#F59E0B' },
  { value: 'completed', label: 'Completed',  dot: '#8B5CF6' },
  { value: 'archived',  label: 'Archived',   dot: '#9CA3AF' },
  { value: 'draft',     label: 'Draft',      dot: '#D1D5DB' },
]

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  active:    { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  presale:   { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
  paused:    { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  completed: { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
  archived:  { bg: '#F9FAFB', text: '#6B7280', border: '#E5E7EB' },
  draft:     { bg: '#F9FAFB', text: '#9CA3AF', border: '#E5E7EB' },
}

interface Props {
  slug: string
  initialStatus: string
}

export function ProjectStatusEditor({ slug, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  const current = STATUS_OPTIONS.find(o => o.value === status) ?? STATUS_OPTIONS[0]
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES.active

  // Close dropdown when clicking outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function select(value: string) {
    setOpen(false)
    if (value === status) return
    setStatus(value)
    startTransition(async () => { await updateProjectStatus(slug, value) })
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="inline-flex items-center gap-1.5 rounded-[6px] border px-2 py-0.5 text-[12px] font-medium transition-all hover:opacity-80"
        style={{ background: styles.bg, color: styles.text, borderColor: styles.border }}
        title="Click to change status"
      >
        {isPending ? (
          <Loader2 size={10} className="animate-spin" />
        ) : (
          <span className="h-[6px] w-[6px] rounded-full flex-none" style={{ background: current.dot }} />
        )}
        {current.label}
        <ChevronDown size={11} className="opacity-60" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-[8px] border border-[#E5E7EB] bg-white shadow-[0_4px_16px_rgba(17,24,39,0.10)]">
          {STATUS_OPTIONS.map(opt => {
            const s = STATUS_STYLES[opt.value] ?? STATUS_STYLES.active
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => select(opt.value)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-[#F9FAFB]"
              >
                <span className="h-[7px] w-[7px] rounded-full flex-none" style={{ background: opt.dot }} />
                <span style={{ color: s.text, fontWeight: opt.value === status ? 600 : 400 }}>
                  {opt.label}
                </span>
                {opt.value === status && (
                  <span className="ml-auto text-[11px] text-content-3">✓</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
