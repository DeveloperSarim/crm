import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

interface ImportRow {
  full_name: string
  phone: string
  email?: string
  address?: string
  query?: string
  budget_display?: string
  intent?: 'buy' | 'rent'
  property_type?: string
  status?: string
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'head') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { rows, projectId, sourceId } = body as {
    rows: ImportRow[]
    projectId: string
    sourceId?: string
  }

  if (!rows?.length || !projectId) {
    return NextResponse.json({ error: 'Missing rows or projectId' }, { status: 400 })
  }

  // Valid enum values that the DB check constraints accept
  const VALID_INTENTS = new Set(['buy', 'rent'])
  const VALID_STATUSES = new Set(['new', 'follow_up', 'interested', 'site_visited', 'negotiation', 'won', 'lost', 'on_hold'])
  const VALID_PROPERTY_TYPES = new Set(['apartment', 'villa', 'building', 'land', 'office', 'commercial', 'retail', 'warehouse'])

  const adminClient = createAdminClient()

  // ── Duplicate detection: fetch all existing phones for this project ───────
  const { data: existingLeads } = await adminClient
    .from('leads')
    .select('phone')
    .eq('project_id', projectId)

  // Normalise: lowercase + strip spaces/dashes for reliable matching
  const normalisePhone = (p: string) => p.replace(/[\s\-().+]/g, '').toLowerCase()
  const existingPhones = new Set((existingLeads ?? []).map(l => normalisePhone(l.phone ?? '')))

  // Helpers to normalise enum values — CSV data may be mixed-case or use spaces
  const normaliseIntent = (v: string | undefined): 'buy' | 'rent' | null => {
    const lower = v?.toLowerCase().trim() ?? ''
    if (lower === 'buy' || lower === 'buying' || lower === 'purchase') return 'buy'
    if (lower === 'rent' || lower === 'renting' || lower === 'rental') return 'rent'
    return null
  }
  const normalisePropType = (v: string | undefined): string | null => {
    const lower = v?.toLowerCase().trim().replace(/[\s/]+/g, '_') ?? ''
    // Map common aliases
    const aliases: Record<string, string> = {
      'land_plot': 'land', 'plot': 'land', 'flat': 'apartment',
      'shop': 'retail', 'store': 'retail',
      'factory': 'warehouse', 'storage': 'warehouse',
    }
    const resolved = aliases[lower] ?? lower
    return VALID_PROPERTY_TYPES.has(resolved) ? resolved : null
  }
  const normaliseStatus = (v: string | undefined): string => {
    const lower = v?.toLowerCase().trim().replace(/\s+/g, '_') ?? ''
    return VALID_STATUSES.has(lower) ? lower : 'new'
  }

  const allInserts = rows.map(row => ({
    project_id: projectId,
    full_name: row.full_name,
    phone: row.phone,
    email: row.email || null,
    address: row.address || null,
    query: row.query || null,
    budget_display: row.budget_display || null,
    intent: normaliseIntent(row.intent),
    property_type: normalisePropType(row.property_type),
    status: normaliseStatus(row.status),
    lead_source_id: sourceId || null,
    submitted_by: user.id,
  }))

  // Split into new vs duplicate rows
  const inserts = allInserts.filter(r => !existingPhones.has(normalisePhone(r.phone ?? '')))
  const skipped = allInserts.length - inserts.length

  // Insert in batches of 100
  const results: { id: string }[] = []
  const errors: { batch: number; error: string }[] = []

  for (let i = 0; i < inserts.length; i += 100) {
    const batch = inserts.slice(i, i + 100)
    const { data, error } = await adminClient.from('leads').insert(batch).select('id')
    if (error) {
      errors.push({ batch: Math.floor(i / 100), error: error.message })
    } else {
      results.push(...(data ?? []))
    }
  }

  return NextResponse.json({
    imported: results.length,
    skipped,
    failed: inserts.length - results.length,
    errors: errors.length > 0 ? errors : undefined,
  })
}
