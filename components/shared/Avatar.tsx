import { cn } from '@/lib/utils/cn'

const PALETTES = [
  { bg: '#FCE7F3', fg: '#9D174D' },
  { bg: '#DBEAFE', fg: '#1E40AF' },
  { bg: '#DCFCE7', fg: '#166534' },
  { bg: '#FEF3C7', fg: '#92400E' },
  { bg: '#EDE9FE', fg: '#5B21B6' },
  { bg: '#FFE4E6', fg: '#9F1239' },
  { bg: '#CFFAFE', fg: '#155E75' },
]

interface AvatarProps {
  name: string
  size?: number
  className?: string
  src?: string
}

export function Avatar({ name, size = 22, className, src }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const palette = PALETTES[name.charCodeAt(0) % PALETTES.length]
  const fontSize = Math.round(size * 0.42)

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover flex-none', className)}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <span
      className={cn('inline-flex flex-none items-center justify-center rounded-full font-semibold tracking-[-0.01em]', className)}
      style={{ width: size, height: size, background: palette.bg, color: palette.fg, fontSize }}
    >
      {initials}
    </span>
  )
}
