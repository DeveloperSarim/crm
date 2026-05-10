'use client'

import { useTransition } from 'react'
import { toggleMemberActive } from '@/lib/actions/partners'

interface Props {
  memberId: string
  isActive: boolean
}

export function TeamToggle({ memberId, isActive }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      await toggleMemberActive(memberId, !isActive)
    })
  }

  const active = isActive

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[11px] font-medium transition-colors disabled:opacity-60 ${
        active
          ? 'bg-[#ECFDF5] text-[#047857] hover:bg-[#D1FAE5]'
          : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-[#10B981]' : 'bg-[#9CA3AF]'}`} />
      {active ? 'Active' : 'Inactive'}
    </button>
  )
}
