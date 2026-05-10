'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  is_read: boolean
  created_at: string
  lead_id: string | null
}

// Show a Chrome / browser notification if permission is granted
function showBrowserNotification(title: string, body: string | null) {
  if (typeof window === 'undefined') return
  if (!('Notification' in window)) return
  if (window.Notification.permission !== 'granted') return
  new window.Notification(title, {
    body: body ?? undefined,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
  })
}

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Request browser notification permission once on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) return
    if (window.Notification.permission === 'default') {
      window.Notification.requestPermission()
    }
  }, [])

  const fetchNotifications = useCallback(async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(30)
    setNotifications((data as Notification[]) ?? [])
    setLoading(false)
  }, [userId, supabase])

  useEffect(() => {
    if (!userId) return
    fetchNotifications()

    // Realtime subscription — new notifications arrive here instantly
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        payload => {
          const n = payload.new as Notification
          setNotifications(prev => [n, ...prev])
          // Also fire a Chrome browser notification
          showBrowserNotification(n.title, n.body)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchNotifications, supabase])

  const markRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }, [supabase])

  const markAllRead = useCallback(async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', userId).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }, [userId, supabase])

  return { notifications, loading, markRead, markAllRead, unreadCount: notifications.filter(n => !n.is_read).length }
}
