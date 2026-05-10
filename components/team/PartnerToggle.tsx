'use client'

import { useState, useTransition } from 'react'
import { togglePartnerActive } from '@/lib/actions/partners'

interface Props {
  partnerId: string
  isActive: boolean
}

export function PartnerToggle({ partnerId, isActive }: Props) {
  const [active, setActive] = useState(isActive)
  const [pending, startTransition] = useTransition()

  function handleToggle() {
    const next = !active
    setActive(next) // optimistic
    startTransition(async () => {
      const result = await togglePartnerActive(partnerId, next)
      if (result.error) setActive(!next) // revert on error
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      className={[
        'inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[11px] font-medium transition-colors',
        active
          ? 'bg-[#ECFDF5] text-[#047857] hover:bg-[#D1FAE5]'
          : 'bg-[#F3F4F6] text-[#9CA3AF] hover:bg-[#E5E7EB]',
        pending ? 'opacity-60 cursor-wait' : 'cursor-pointer',
      ].join(' ')}
      title={active ? 'Click to deactivate' : 'Click to activate'}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-[#10B981]' : 'bg-[#9CA3AF]'}`} />
      {active ? 'Active' : 'Inactive'}
    </button>
  )
}
