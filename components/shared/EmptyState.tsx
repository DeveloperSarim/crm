import { cn } from '@/lib/utils/cn'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-2 text-content-3">
          {icon}
        </div>
      )}
      <div className="text-[14px] font-semibold text-content">{title}</div>
      {description && (
        <div className="mt-1.5 max-w-[280px] text-[13px] leading-[1.55] text-content-2">{description}</div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
