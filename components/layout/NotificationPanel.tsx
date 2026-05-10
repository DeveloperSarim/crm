'use client'

import { useEffect, useRef } from 'react'
import { X, Bell } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatRelative } from '@/lib/utils/formatters'
import type { Notification as DBNotification } from '@/lib/types/database.types'
type Notification = DBNotification | import('@/lib/hooks/useNotifications').Notification

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
  notifications?: Notification[]
  onMarkRead?: (id: string) => void
  onMarkAllRead?: () => void
}

const TYPE_LABELS: Record<string, string> = {
  new_external_lead: 'New External Lead',
  lead_assigned: 'Lead Assigned',
  follow_up_due: 'Follow-up Due',
  commission_update: 'Commission Update',
}

export function NotificationPanel({
  open,
  onClose,
  notifications = [],
  onMarkRead,
  onMarkAllRead,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, onClose])

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div
      ref={panelRef}
      className={cn(
        'fixed right-4 top-14 z-40 w-[380px] overflow-hidden rounded-xl border border-border bg-white shadow-[0_20px_50px_rgba(17,24,39,0.12),_0_4px_12px_rgba(17,24,39,0.05)]',
        'transition-all duration-150',
        open ? 'pointer-events-auto opacity-100 translate-y-0' : 'pointer-events-none opacity-0 -translate-y-1'
      )}
    >
      {/* Header */}
      <div className="flex items-center border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-content-2" />
          <span className="text-[13px] font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-brand px-1.5 py-px text-[10px] font-medium text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex-1" />
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="mr-2 text-[12px] text-brand hover:underline"
          >
            Mark all read
          </button>
        )}
        <button onClick={onClose} className="text-content-3 hover:text-content-2">
          <X size={14} />
        </button>
      </div>

      {/* List */}
      <div className="max-h-[420px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell size={20} className="mb-2 text-content-3" />
            <div className="text-[13px] font-medium text-content">All caught up</div>
            <div className="text-[12px] text-content-3">No new notifications</div>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              onClick={() => onMarkRead?.(n.id)}
              className={cn(
                'flex cursor-pointer gap-3 border-b border-border/60 px-4 py-3 transition-colors hover:bg-surface-2',
                !n.is_read && 'bg-brand/[0.02]'
              )}
            >
              {!n.is_read && (
                <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-brand" />
              )}
              {n.is_read && <span className="mt-1.5 h-1.5 w-1.5 flex-none" />}
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-content-3">
                  {TYPE_LABELS[n.type] || n.type}
                </div>
                <div className="mt-px text-[13px] font-medium text-content">{n.title}</div>
                {n.body && <div className="mt-0.5 text-[12px] text-content-2">{n.body}</div>}
                <div className="mt-1 text-[11.5px] text-content-3">
                  {formatRelative(n.created_at)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
