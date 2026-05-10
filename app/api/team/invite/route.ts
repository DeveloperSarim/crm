import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'head') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, full_name, role, company_name, phone } = await req.json()
  if (!email || !full_name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const validRoles = ['sales_member', 'head', 'external']
  const assignedRole = validRoles.includes(role) ? role : 'sales_member'

  const adminClient = createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3004'

  // External partners go to /partner/reset-password (dedicated page, redirects to /partner/login).
  // Internal staff go to /reset-password (redirects to /login).
  const resetPath = assignedRole === 'external' ? '/partner/reset-password' : '/reset-password'

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=${resetPath}`,
    data: { full_name, role: assignedRole },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Ensure profile has correct details (DB trigger may race on invite)
  if (data.user) {
    await adminClient.from('profiles').upsert(
      {
        id: data.user.id,
        full_name,
        email,
        role: assignedRole,
        ...(company_name ? { company_name } : {}),
        ...(phone ? { phone } : {}),
      },
      { onConflict: 'id' }
    )
  }

  return NextResponse.json({ success: true })
}
