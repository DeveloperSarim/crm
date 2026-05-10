'use client'

import { Bell, Menu } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { NotificationPanel } from './NotificationPanel'
import { useState } from 'react'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { useCurrentUser } from '@/lib/hooks/useCurrentUser'

interface TopbarProps {
  crumbs?: string[]
  action?: React.ReactNode
  className?: string
}

export function Topbar({ crumbs = [], action, className }: TopbarProps) {
  const [notifOpen, setNotifOpen] = useState(false)
  const currentUser = useCurrentUser()
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(currentUser?.id ?? '')

  return (
    <>
      <header
        className={cn(
          'flex h-12 flex-none items-center gap-3.5 border-b border-border bg-white px-4 sm:px-5',
          className
        )}
      >
        {/* Hamburger — mobile only */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('rayash:toggle-sidebar'))}
          className="flex h-7 w-7 flex-none items-center justify-center rounded-[6px] text-content-2 hover:bg-surface-2 sm:hidden"
        >
          <Menu size={16} />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-[13px] text-content-2">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-content-3">/</span>}
              <span className={cn('truncate', i === crumbs.length - 1 ? 'font-medium text-content' : 'text-content-2')}>
                {c}
              </span>
            </span>
          ))}
        </div>

        {action}

        <button
          onClick={() => setNotifOpen(v => !v)}
          className="relative flex h-7 w-7 items-center justify-center rounded-[6px] text-content-2 hover:bg-surface-2"
        >
          <Bell size={15} />
          {unreadCount > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-brand px-[3px] text-[9px] font-medium text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </header>

      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
      />
    </>
  )
}
