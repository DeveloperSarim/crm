'use client'

import { useEffect, useRef, useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Inbox, Search, ArrowRight, Loader2, X } from 'lucide-react'
import { searchWorkspace, type SearchResult } from '@/lib/actions/search'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Focus input when palette opens
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  // Debounced search
  const handleQueryChange = useCallback((val: string) => {
    setQuery(val)
    setActiveIdx(0)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!val.trim()) { setResults([]); return }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const { results } = await searchWorkspace(val)
        setResults(results)
      })
    }, 180)
  }, [])

  // Navigate to result
  const navigate = useCallback((result: SearchResult) => {
    onClose()
    router.push(result.href)
  }, [onClose, router])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); return }
      if (e.key === 'Enter' && results[activeIdx]) { navigate(results[activeIdx]); return }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, results, activeIdx, navigate, onClose])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9990] bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="fixed left-1/2 top-[20vh] z-[9991] w-full max-w-[540px] -translate-x-1/2 overflow-hidden rounded-[14px] border border-border bg-white shadow-[0_24px_64px_rgba(0,0,0,0.14)]">
        {/* Input row */}
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          {isPending
            ? <Loader2 size={16} className="flex-none animate-spin text-brand" />
            : <Search size={16} className="flex-none text-content-3" />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            placeholder="Search projects, leads…"
            className="flex-1 bg-transparent text-[14px] text-content outline-none placeholder:text-content-3"
          />
          {query && (
            <button onClick={() => handleQueryChange('')} className="flex-none text-content-3 hover:text-content">
              <X size={14} />
            </button>
          )}
          <kbd className="rounded-[4px] border border-border bg-[#F9FAFB] px-1.5 py-0.5 font-mono text-[10.5px] text-content-3">
            Esc
          </kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="py-1.5">
            {/* Group: Projects */}
            {results.filter(r => r.type === 'project').length > 0 && (
              <div>
                <div className="px-4 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-content-3">
                  Projects
                </div>
                {results.filter(r => r.type === 'project').map((r, i) => {
                  const globalIdx = results.indexOf(r)
                  return (
                    <ResultRow
                      key={r.id}
                      result={r}
                      active={activeIdx === globalIdx}
                      onHover={() => setActiveIdx(globalIdx)}
                      onClick={() => navigate(r)}
                    />
                  )
                })}
              </div>
            )}

            {/* Group: Leads */}
            {results.filter(r => r.type === 'lead').length > 0 && (
              <div>
                <div className="px-4 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-content-3">
                  Leads
                </div>
                {results.filter(r => r.type === 'lead').map((r) => {
                  const globalIdx = results.indexOf(r)
                  return (
                    <ResultRow
                      key={r.id}
                      result={r}
                      active={activeIdx === globalIdx}
                      onHover={() => setActiveIdx(globalIdx)}
                      onClick={() => navigate(r)}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Empty state — only show after typing */}
        {query.trim().length > 0 && results.length === 0 && !isPending && (
          <div className="px-4 py-8 text-center text-[13px] text-content-3">
            No results for &ldquo;<span className="text-content">{query}</span>&rdquo;
          </div>
        )}

        {/* Hint footer */}
        <div className="flex items-center gap-3 border-t border-border px-4 py-2">
          <span className="flex items-center gap-1 text-[11px] text-content-3">
            <kbd className="rounded border border-border bg-[#F9FAFB] px-1 font-mono text-[10px]">↑↓</kbd> navigate
          </span>
          <span className="flex items-center gap-1 text-[11px] text-content-3">
            <kbd className="rounded border border-border bg-[#F9FAFB] px-1 font-mono text-[10px]">↵</kbd> open
          </span>
          <span className="ml-auto text-[11px] text-content-3">⌘K to close</span>
        </div>
      </div>
    </>
  )
}

function ResultRow({
  result,
  active,
  onHover,
  onClick,
}: {
  result: SearchResult
  active: boolean
  onHover: () => void
  onClick: () => void
}) {
  const Icon = result.type === 'project' ? Building2 : Inbox

  return (
    <button
      onMouseEnter={onHover}
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
        active ? 'bg-[#F3F7FF]' : 'hover:bg-[#FAFAFA]'
      }`}
    >
      <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-[6px] ${
        result.type === 'project'
          ? 'bg-blue-50 text-blue-500'
          : 'bg-amber-50 text-amber-500'
      }`}>
        <Icon size={13} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-content">{result.title}</div>
        {result.subtitle && (
          <div className="truncate text-[11.5px] text-content-3">{result.subtitle}</div>
        )}
      </div>
      {active && <ArrowRight size={13} className="flex-none text-content-3" />}
    </button>
  )
}
