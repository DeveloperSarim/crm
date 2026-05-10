'use client'

import { useState, useRef, useEffect } from 'react'
import { Link2, Globe, Lock, Copy, Check, ChevronDown, Loader2 } from 'lucide-react'
import { toggleProjectPublic } from '@/lib/actions/files'

interface ShareButtonProps {
  projectId: string
  projectSlug: string
  isPublic: boolean // is_published value from DB
  isHead: boolean
}

export function ShareButton({ projectId, projectSlug, isPublic: initialIsPublic, isHead }: ShareButtonProps) {
  const [open, setOpen] = useState(false)
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [copied, setCopied] = useState(false)
  const [toggling, setToggling] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/projects/${projectSlug}`
    : `/projects/${projectSlug}`

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleTogglePublic() {
    if (!isHead) return
    setToggling(true)
    const result = await toggleProjectPublic(projectId, projectSlug, !isPublic)
    if (!result?.error) setIsPublic(v => !v)
    setToggling(false)
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1.5 rounded-[6px] border border-border bg-white px-2.5 py-[5px] text-[13px] font-medium text-content hover:bg-surface-2 transition-colors"
      >
        <Link2 size={12} />
        Share
        <ChevronDown size={11} className={`text-content-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-[300px] overflow-hidden rounded-[10px] border border-border bg-white shadow-[0_8px_24px_rgba(17,24,39,0.1)]">
          {/* Header */}
          <div className="border-b border-border px-4 py-3">
            <div className="text-[13px] font-semibold">Share project</div>
            <div className="mt-0.5 text-[12px] text-content-2">
              {isPublic ? 'Anyone with the link can view this project.' : 'Only workspace members can access this project.'}
            </div>
          </div>

          {/* Visibility toggle (head only) */}
          {isHead && (
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                {isPublic ? (
                  <Globe size={14} className="text-brand" />
                ) : (
                  <Lock size={14} className="text-content-3" />
                )}
                <div>
                  <div className="text-[12.5px] font-medium">{isPublic ? 'Public' : 'Private'}</div>
                  <div className="text-[11.5px] text-content-3">
                    {isPublic ? 'Visible to anyone with the link' : 'Workspace members only'}
                  </div>
                </div>
              </div>
              <button
                onClick={handleTogglePublic}
                disabled={toggling}
                className="relative h-5 w-9 flex-none rounded-full transition-colors disabled:opacity-60"
                style={{ background: isPublic ? '#2563EB' : '#D1D5DB' }}
              >
                {toggling ? (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Loader2 size={10} className="animate-spin text-white" />
                  </span>
                ) : (
                  <span
                    className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all"
                    style={{ left: isPublic ? '18px' : '2px' }}
                  />
                )}
              </button>
            </div>
          )}

          {/* Copy link */}
          <div className="px-4 py-3">
            <div className="mb-1.5 text-[11.5px] text-content-3">Project link</div>
            <div className="flex items-center gap-2 rounded-[6px] border border-border bg-surface-2 pl-2.5 pr-1 py-1">
              <span className="flex-1 truncate font-mono text-[11.5px] text-content-2">{shareUrl}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-[4px] bg-white px-2 py-1 text-[11.5px] font-medium border border-border hover:bg-surface-2 transition-colors"
              >
                {copied ? (
                  <><Check size={11} className="text-green-500" /> Copied!</>
                ) : (
                  <><Copy size={11} /> Copy</>
                )}
              </button>
            </div>
          </div>

          {/* Embed hint */}
          {isPublic && (
            <div className="border-t border-border px-4 py-2.5">
              <div className="text-[11.5px] text-content-3">
                This project is publicly listed in the portal. Leads from the public form will be auto-linked.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
