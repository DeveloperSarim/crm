'use client'

import { useState, useTransition } from 'react'
import { Pin } from 'lucide-react'
import { togglePinProject } from '@/lib/actions/projects'
import { cn } from '@/lib/utils/cn'

interface PinButtonProps {
  projectId: string
  isPinned: boolean
}

export function PinButton({ projectId, isPinned: initialPinned }: PinButtonProps) {
  const [isPinned, setIsPinned] = useState(initialPinned)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function handleClick(e: React.MouseEvent) {
    // Prevent the parent <Link> from navigating
    e.preventDefault()
    e.stopPropagation()

    setErrorMsg(null)
    startTransition(async () => {
      const result = await togglePinProject(projectId)
      if ('error' in result) {
        setErrorMsg(result.error)
        setTimeout(() => setErrorMsg(null), 3000)
      } else {
        setIsPinned(result.pinned)
      }
    })
  }

  return (
    <div className="absolute right-2.5 top-2.5 z-10">
      {errorMsg && (
        <div className="absolute right-8 top-0 w-52 rounded-[6px] bg-[#1F2937] px-2.5 py-1.5 text-[11.5px] text-white shadow-lg">
          {errorMsg}
        </div>
      )}
      <button
        onClick={handleClick}
        disabled={isPending}
        title={isPinned ? 'Unpin project' : 'Pin to sidebar'}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-[6px] transition-all',
          isPinned
            ? 'bg-brand/10 text-brand opacity-100 hover:bg-brand/20'
            : 'bg-black/20 text-white opacity-0 hover:bg-black/30 group-hover:opacity-100',
          isPending && 'cursor-wait opacity-60'
        )}
      >
        {isPinned ? <Pin size={13} className="fill-brand" /> : <Pin size={13} />}
      </button>
    </div>
  )
}
