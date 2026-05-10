'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

interface SubmitButtonProps {
  label: string
  loadingLabel?: string
  className?: string
  variant?: 'primary' | 'danger'
}

export function SubmitButton({
  label,
  loadingLabel,
  className,
  variant = 'primary',
}: SubmitButtonProps) {
  const { pending } = useFormStatus()

  const base =
    variant === 'primary'
      ? 'rounded-[7px] bg-brand px-4 py-2 text-[13px] font-medium text-white shadow-[0_1px_0_rgba(0,0,0,0.06)] hover:bg-brand/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed'
      : 'rounded-[7px] bg-[#EF4444] px-4 py-2 text-[13px] font-medium text-white hover:bg-red-600 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed'

  return (
    <button type="submit" disabled={pending} className={className ?? base}>
      {pending ? (
        <span className="flex items-center gap-2">
          <Loader2 size={13} className="animate-spin" />
          {loadingLabel ?? 'Saving…'}
        </span>
      ) : (
        label
      )}
    </button>
  )
}
