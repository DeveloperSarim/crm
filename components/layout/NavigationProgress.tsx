'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Thin blue progress bar at the top of the viewport during navigation.
 * No opacity dim, no view transitions — just the bar.
 *
 * useSearchParams() removed intentionally: in Next.js 14 it forces a
 * dynamic render boundary that causes full-page re-fetches on navigation.
 * usePathname() alone is sufficient to detect route changes.
 */
export function NavigationProgress() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const completingRef = useRef(false)
  const prevPathRef = useRef(pathname)

  // Start bar on any internal link click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as Element).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('#')) return
      const currentPath = window.location.pathname + window.location.search
      if (href === currentPath) return
      startProgress()
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Complete bar when pathname actually changes
  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname
      completeProgress()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  function startProgress() {
    if (timerRef.current) clearInterval(timerRef.current)
    completingRef.current = false
    setVisible(true)
    setProgress(10)

    let p = 10
    timerRef.current = setInterval(() => {
      p = p < 65 ? p + 7 : p < 85 ? p + 1.5 : p
      setProgress(p)
    }, 100)
  }

  function completeProgress() {
    if (timerRef.current) clearInterval(timerRef.current)
    completingRef.current = true
    setProgress(100)
    setTimeout(() => {
      if (completingRef.current) { setVisible(false); setProgress(0) }
    }, 280)
  }

  if (!visible) return null

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-[3px] bg-brand"
      style={{
        width: `${progress}%`,
        transition: progress === 100 ? 'width 180ms ease-out' : 'width 80ms linear',
        boxShadow: '0 0 10px rgba(37,99,235,0.55)',
      }}
    />
  )
}
