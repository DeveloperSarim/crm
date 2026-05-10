'use client'

import { useRef, useState, useTransition } from 'react'
import { Loader2, Send } from 'lucide-react'
import { addLeadNote } from '@/lib/actions/notes'

interface Props {
  leadId: string
  projectSlug: string
  onNoteAdded?: (note: { id: string; content: string; created_at: string }) => void
}

export function AddNoteForm({ leadId, projectSlug, onNoteAdded }: Props) {
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || isPending) return
    setError(null)

    const noteContent = content.trim()
    startTransition(async () => {
      const result = await addLeadNote(leadId, projectSlug, noteContent)
      if (result?.error) {
        setError(result.error)
      } else {
        setContent('')
        textareaRef.current?.focus()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="border-b border-border/60 p-4">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={2}
        placeholder="Add a note…"
        disabled={isPending}
        onKeyDown={e => {
          // Ctrl/Cmd + Enter submits
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit(e as any)
        }}
        className="w-full resize-none rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20 disabled:opacity-60 transition-opacity"
      />
      {error && <p className="mt-1 text-[11.5px] text-red-500">{error}</p>}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-content-3">⌘↵ to submit</span>
        <button
          type="submit"
          disabled={isPending || !content.trim()}
          className="inline-flex items-center gap-1.5 rounded-[6px] bg-brand px-3 py-1.5 text-[12px] font-medium text-white shadow-[0_1px_0_rgba(0,0,0,0.06)] hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isPending ? (
            <><Loader2 size={12} className="animate-spin" /> Adding…</>
          ) : (
            <><Send size={12} /> Add note</>
          )}
        </button>
      </div>
    </form>
  )
}
