import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'

export function formatDate(date: string | Date | null): string {
  if (!date) return '—'
  const d = new Date(date)
  if (isToday(d)) return `Today`
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMM d, yyyy')
}

export function formatRelative(date: string | Date | null): string {
  if (!date) return '—'
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatPhone(phone: string): string {
  return phone.replace(/(\+\d{2})(\d{5})(\d{5})/, '$1 $2 $3')
}

export function formatCurrency(amount: number | null, currency = 'SAR'): string {
  if (!amount) return '—'
  if (amount >= 1000000) return `${currency} ${(amount / 1000000).toFixed(2)}M`
  if (amount >= 1000) return `${currency} ${(amount / 1000).toFixed(0)}K`
  return `${currency} ${amount}`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
