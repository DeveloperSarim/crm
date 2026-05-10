'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import {
  LayoutDashboard, Building2, Inbox, Users, BarChart2, Settings, Handshake,
  FolderOpen, PanelLeftClose, PanelLeftOpen, LogOut, X,
} from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import { Avatar } from '@/components/shared/Avatar'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { cn } from '@/lib/utils/cn'
import type { Profile } from '@/lib/types/database.types'
import { createClient } from '@/lib/supabase/client'

interface SidebarProps {
  profile: Profile
  projectCount?: number
  leadCount?: number
  pinnedProjects?: { id: string; slug: string; name: string; color_hue: number }[]
}

const NAV_COLORS = ['#0EA5E9', '#F59E0B', '#8B5CF6', '#10B981', '#F97316', '#EF4444']

export function Sidebar({ profile, projectCount, leadCount, pinnedProjects = [] }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isHead = profile.role === 'head'
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  // Track which href was clicked so active state updates instantly (optimistic)
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  // Clear pending + close mobile sidebar on navigation
  useEffect(() => {
    setPendingHref(null)
    setMobileOpen(false)
  }, [pathname])

  // Listen for hamburger toggle fired from Topbar
  useEffect(() => {
    function handler() { setMobileOpen(v => !v) }
    window.addEventListener('rayash:toggle-sidebar', handler)
    return () => window.removeEventListener('rayash:toggle-sidebar', handler)
  }, [])

  const navItems = [
    { id: 'dashboard', href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', href: '/projects', label: 'Projects', icon: Building2, badge: projectCount },
    { id: 'leads', href: '/leads', label: 'Leads', icon: Inbox, badge: leadCount },
    ...(isHead ? [
      { id: 'team', href: '/team', label: 'Team', icon: Users },
      { id: 'partners', href: '/partners', label: 'Partners', icon: Handshake },
      { id: 'statistics', href: '/statistics', label: 'Analytics', icon: BarChart2 },
      { id: 'commissions', href: '/commissions', label: 'Commissions', icon: FolderOpen },
    ] : []),
    { id: 'settings', href: '/settings', label: 'Settings', icon: Settings },
  ]

  // ── Prefetch all nav routes as soon as sidebar mounts ──────────────────
  // This loads the route data in the background so the first click is fast
  useEffect(() => {
    navItems.forEach(item => router.prefetch(item.href))
    pinnedProjects.forEach(p => router.prefetch(`/projects/${p.slug}`))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Global ⌘K / Ctrl+K listener ────────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // An item is "active" if the real pathname matches OR we just clicked it
  function isActive(href: string) {
    return pathname.startsWith(href) || pendingHref === href
  }

  function handleNavClick(href: string) {
    setPendingHref(href) // immediate visual feedback
  }

  return (
    <>
      {/* ── Mobile backdrop ───────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[rgba(17,24,39,0.35)] sm:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Collapsed icon bar — desktop only ─────────────────────────────── */}
      {collapsed && (
        <aside className="hidden sm:flex h-full w-[56px] flex-none flex-col items-center border-r border-border bg-surface-2 py-3 gap-1">
          <button
            onClick={() => setCollapsed(false)}
            className="mb-3 flex h-8 w-8 items-center justify-center rounded-[6px] text-content-3 hover:bg-border/50"
            title="Expand sidebar"
          >
            <PanelLeftOpen size={15} />
          </button>
          {navItems.map(item => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => handleNavClick(item.href)}
                title={item.label}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-[6px] transition-colors',
                  active ? 'bg-[#EDEEF0] text-content' : 'text-content-3 hover:bg-border/40 hover:text-content'
                )}
              >
                <item.icon size={15} />
              </Link>
            )
          })}
        </aside>
      )}

      {/* ── Full sidebar — mobile: fixed overlay  /  desktop: in-flow ─────── */}
      <aside
        className={cn(
          'flex flex-col border-r border-border bg-surface-2 px-3 py-[14px]',
          // Mobile: fixed slide-in overlay
          'fixed inset-y-0 left-0 z-50 w-[260px] transition-transform duration-200 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: static in-flow, restore normal behaviour
          'sm:relative sm:inset-auto sm:z-auto sm:transition-none',
          collapsed
            ? 'sm:hidden'  // collapsed bar above handles desktop
            : 'sm:flex sm:w-[232px] sm:flex-none sm:h-full sm:translate-x-0',
        )}
      >
      {/* Logo + collapse */}
      <div className="mb-2 flex items-center justify-between px-1.5 pb-3.5">
        <Logo />
        {/* Desktop: collapse button */}
        <button
          onClick={() => setCollapsed(true)}
          className="hidden sm:flex h-[22px] w-[22px] items-center justify-center rounded-[4px] text-content-3 hover:bg-border/50"
          title="Collapse sidebar"
        >
          <PanelLeftClose size={14} />
        </button>
        {/* Mobile: close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="flex sm:hidden h-[22px] w-[22px] items-center justify-center rounded-[4px] text-content-3 hover:bg-border/50"
        >
          <X size={14} />
        </button>
      </div>

      {/* Search — clicking opens command palette */}
      <button
        onClick={() => setPaletteOpen(true)}
        className="relative mb-2 flex w-full cursor-text items-center gap-2 rounded-[6px] border border-border bg-white px-2.5 py-1.5 text-left hover:border-brand/30 hover:bg-[#F8FAFF] transition-colors"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="flex-none text-content-3">
          <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
        </svg>
        <span className="flex-1 text-[12.5px] text-content-3">Search…</span>
        <span className="rounded-[3px] border border-border bg-[#F9FAFB] px-1 font-mono text-[10.5px] text-content-3">
          ⌘K
        </span>
      </button>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Nav */}
      <nav className="flex flex-col gap-px">
        {navItems.map(item => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.id}
              href={item.href}
              prefetch={true}
              onClick={() => handleNavClick(item.href)}
              className={cn(
                'flex items-center gap-2.5 rounded-[6px] px-2 py-[6px] text-[13px] transition-colors',
                active
                  ? 'bg-[#EDEEF0] font-medium text-content'
                  : 'text-content-2 hover:bg-border/40 hover:text-content'
              )}
            >
              <item.icon size={15} className={active ? 'text-content' : 'text-content-3'} />
              <span className="flex-1">{item.label}</span>
              {item.badge != null && (
                <span className="rounded-[10px] border border-border bg-white px-1.5 py-px font-tabular text-[11px] text-content-2">
                  {item.badge}
                </span>
              )}
              {/* Subtle spinner while navigating to this item */}
              {pendingHref === item.href && !pathname.startsWith(item.href) && (
                <span className="h-2.5 w-2.5 animate-spin rounded-full border border-content-3 border-t-transparent" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Pinned projects */}
      {pinnedProjects.length > 0 && (
        <div className="mt-4">
          <div className="px-2 pb-1 text-[11px] font-medium uppercase tracking-[0.02em] text-content-3">
            Pinned
          </div>
          <div className="flex flex-col gap-px">
            {pinnedProjects.map((p, i) => {
              const href = `/projects/${p.slug}`
              const active = isActive(href)
              return (
                <Link
                  key={p.id}
                  href={href}
                  prefetch={true}
                  onClick={() => handleNavClick(href)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-[6px] px-2 py-[5px] text-[13px] transition-colors',
                    active
                      ? 'bg-[#EDEEF0] font-medium text-content'
                      : 'text-content-2 hover:bg-border/40 hover:text-content'
                  )}
                >
                  <span
                    className="h-[6px] w-[6px] flex-none rounded-[2px]"
                    style={{ background: NAV_COLORS[i % NAV_COLORS.length] }}
                  />
                  <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{p.name}</span>
                  {pendingHref === href && !active && (
                    <span className="h-2.5 w-2.5 animate-spin rounded-full border border-content-3 border-t-transparent" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex-1" />

      {/* User */}
      <div className="flex items-center gap-2.5 border-t border-border px-1.5 pt-3">
        <Avatar name={profile.full_name} size={26} src={profile.avatar_url ?? undefined} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-medium text-content">{profile.full_name}</div>
          <div className="text-[11px] text-content-2">{profile.role === 'head' ? 'Sales Head · Admin' : 'Sales Member'}</div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex-none text-content-3 hover:text-content-2 transition-colors"
          title="Sign out"
        >
          <LogOut size={13} />
        </button>
      </div>
    </aside>
    </>
  )
}
