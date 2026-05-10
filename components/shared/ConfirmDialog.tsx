'use client'

import { cn } from '@/lib/utils/cn'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  confirmVariant?: 'danger' | 'default'
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmVariant = 'default',
  loading,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,24,39,0.18)] backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-[360px] rounded-[10px] border border-border bg-white p-6 shadow-[0_20px_50px_rgba(17,24,39,0.18)]"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h3>
        {description && <p className="mt-1.5 text-[13px] text-content-2">{description}</p>}
        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="rounded-[6px] border border-border bg-white px-3 py-1.5 text-[13px] font-medium text-content hover:bg-surface-2"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'rounded-[6px] px-3 py-1.5 text-[13px] font-medium text-white disabled:opacity-60',
              confirmVariant === 'danger' ? 'bg-[#EF4444]' : 'bg-brand'
            )}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
