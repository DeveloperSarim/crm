export const LEAD_STATUSES = [
  { value: 'new', label: 'New', color: '#3B82F6', bg: '#EFF6FF', fg: '#1D4ED8' },
  { value: 'contacted', label: 'Contacted', color: '#9CA3AF', bg: '#F3F4F6', fg: '#374151' },
  { value: 'interested', label: 'Interested', color: '#8B5CF6', bg: '#F5F3FF', fg: '#6D28D9' },
  { value: 'site_visit', label: 'Site Visit', color: '#F59E0B', bg: '#FFFBEB', fg: '#B45309' },
  { value: 'negotiation', label: 'Negotiation', color: '#F59E0B', bg: '#FFFBEB', fg: '#B45309' },
  { value: 'closed_won', label: 'Closed Won', color: '#10B981', bg: '#ECFDF5', fg: '#047857' },
  { value: 'closed_lost', label: 'Closed Lost', color: '#EF4444', bg: '#FEF2F2', fg: '#B91C1C' },
  { value: 'on_hold', label: 'On Hold', color: '#9CA3AF', bg: '#F3F4F6', fg: '#374151' },
] as const

export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment', glyph: '▤' },
  { value: 'villa', label: 'Villa', glyph: '◮' },
  { value: 'building', label: 'Building', glyph: '▦' },
  { value: 'land', label: 'Land / Plot', glyph: '▱' },
  { value: 'office', label: 'Office', glyph: '◫' },
  { value: 'commercial', label: 'Commercial', glyph: '◧' },
  { value: 'retail', label: 'Retail', glyph: '◨' },
  { value: 'warehouse', label: 'Warehouse', glyph: '▭' },
] as const

export const PROJECT_STATUSES = [
  { value: 'active', label: 'Active', color: '#10B981', bg: '#ECFDF5', fg: '#047857' },
  { value: 'presale', label: 'Pre-sale', color: '#8B5CF6', bg: '#F5F3FF', fg: '#6D28D9' },
  { value: 'paused', label: 'Paused', color: '#9CA3AF', bg: '#F3F4F6', fg: '#374151' },
  { value: 'completed', label: 'Completed', color: '#3B82F6', bg: '#EFF6FF', fg: '#1D4ED8' },
  { value: 'archived', label: 'Archived', color: '#9CA3AF', bg: '#F3F4F6', fg: '#374151' },
] as const

export const ROLES = {
  head: 'Sales Head',
  sales_member: 'Sales Member',
  external: 'Realtor / External',
} as const

export const INTENTS = [
  { value: 'buy', label: 'Buy' },
  { value: 'rent', label: 'Rent' },
] as const

export const TIMELINES = [
  '0–3 months',
  '3–6 months',
  '6–12 months',
  'Just exploring',
] as const

export const COMMISSION_RATE = 1.25 // percent
