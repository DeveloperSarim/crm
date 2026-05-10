import { cn } from '@/lib/utils/cn'

interface LogoProps {
  small?: boolean
  className?: string
  dark?: boolean
}

export function Logo({ small, className, dark }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className="relative flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[6px]"
        style={{ background: dark ? '#fff' : 'linear-gradient(180deg, #111827, #374151)' }}
      >
        <span
          className="text-[11px] font-bold tracking-[-0.02em]"
          style={{ color: dark ? '#0B1220' : '#fff' }}
        >
          R
        </span>
      </div>
      {!small && (
        <div className="flex flex-col leading-[1.1]">
          <span className="text-[13px] font-semibold tracking-[-0.01em] text-content">Rayash</span>
          <span className="text-[10.5px] text-content-2">Real Estate</span>
        </div>
      )}
    </div>
  )
}
