import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Supabase Auth callback handler (PKCE flow).
 *
 * Invite / password-reset / magic-link emails contain a one-time `?code=`
 * parameter.  This route exchanges that code for a real session, then redirects
 * to wherever `next` points.
 *
 * URL shape:
 *   /auth/callback?code=XXX&next=/reset-password
 *   /auth/callback?code=XXX&next=/partner/reset-password
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // Decide which login page to show on failure (partner vs internal)
  const isPartnerFlow = next.startsWith('/partner/')
  const loginFallback = isPartnerFlow ? '/partner/login' : '/login'

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Code missing or exchange failed — send to the correct login with a hint
  return NextResponse.redirect(`${origin}${loginFallback}?error=link_expired`)
}
