import { LEAD_STATUSES, PROJECT_STATUSES } from '@/lib/utils/constants'
import { cn } from '@/lib/utils/cn'

interface StatusBadgeProps {
  kind: string
  dot?: boolean
  className?: string
}

const STATUS_MAP: Record<string, { bg: string; fg: string; dot: string; label: string }> = {
  // Lead statuses
  new: { bg: '#EFF6FF', fg: '#1D4ED8', dot: '#3B82F6', label: 'New' },
  contacted: { bg: '#F3F4F6', fg: '#374151', dot: '#9CA3AF', label: 'Contacted' },
  interested: { bg: '#F5F3FF', fg: '#6D28D9', dot: '#8B5CF6', label: 'Interested' },
  site_visit: { bg: '#FFFBEB', fg: '#B45309', dot: '#F59E0B', label: 'Site Visit' },
  negotiation: { bg: '#FFFBEB', fg: '#B45309', dot: '#F59E0B', label: 'Negotiation' },
  closed_won: { bg: '#ECFDF5', fg: '#047857', dot: '#10B981', label: 'Closed Won' },
  closed_lost: { bg: '#FEF2F2', fg: '#B91C1C', dot: '#EF4444', label: 'Closed Lost' },
  on_hold: { bg: '#F3F4F6', fg: '#374151', dot: '#9CA3AF', label: 'On Hold' },
  // Project statuses
  active: { bg: '#ECFDF5', fg: '#047857', dot: '#10B981', label: 'Active' },
  presale: { bg: '#F5F3FF', fg: '#6D28D9', dot: '#8B5CF6', label: 'Pre-sale' },
  paused: { bg: '#F3F4F6', fg: '#374151', dot: '#9CA3AF', label: 'Paused' },
  completed: { bg: '#EFF6FF', fg: '#1D4ED8', dot: '#3B82F6', label: 'Completed' },
  archived: { bg: '#F3F4F6', fg: '#374151', dot: '#9CA3AF', label: 'Archived' },
  // Commission
  pending: { bg: '#FFFBEB', fg: '#B45309', dot: '#F59E0B', label: 'Pending' },
  approved: { bg: '#EFF6FF', fg: '#1D4ED8', dot: '#3B82F6', label: 'Approved' },
  paid: { bg: '#ECFDF5', fg: '#047857', dot: '#10B981', label: 'Paid' },
}

export function StatusBadge({ kind, dot = true, className }: StatusBadgeProps) {
  const s = STATUS_MAP[kind] || STATUS_MAP.new

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-[6px] px-2 py-[2px] text-[12px] font-medium leading-[18px]', className)}
      style={{ background: s.bg, color: s.fg }}
    >
      {dot && (
        <span className="h-[6px] w-[6px] rounded-full flex-none" style={{ background: s.dot }} />
      )}
      {s.label}
    </span>
  )
}
