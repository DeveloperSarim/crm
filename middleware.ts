import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Routes that don't require authentication (allow unauthenticated access)
  const publicRoutes = ['/login', '/forgot-password', '/reset-password', '/partner/reset-password', '/auth/callback', '/auth/invite', '/partner/login']
  const isPublicRoute = publicRoutes.some(r => pathname.startsWith(r))

  // Routes where an already-logged-in user should be redirected away.
  // NOTE: /reset-password is intentionally excluded — invited users have a
  // valid session but still need to set their first password here.
  const authOnlyRoutes = ['/login', '/forgot-password', '/partner/login']
  const isAuthOnlyRoute = authOnlyRoutes.some(r => pathname.startsWith(r))

  // Not logged in → redirect to appropriate login page
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    // External portal routes redirect to partner login
    const portalRoutes = ['/portal', '/my-leads', '/submit-lead', '/account']
    const isPortalRoute = portalRoutes.some(r => pathname.startsWith(r))
    url.pathname = isPortalRoute ? '/partner/login' : '/login'
    return NextResponse.redirect(url)
  }

  // Logged in + on a pure auth-only route → redirect to appropriate panel
  if (user && isAuthOnlyRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const url = request.nextUrl.clone()
    url.pathname = profile?.role === 'external' ? '/portal' : '/dashboard'
    return NextResponse.redirect(url)
  }

  // Logged in — enforce role-based routing
  if (user && !isPublicRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    // Inactive user → logout
    if (profile && !profile.is_active) {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    const role = profile?.role

    // External users trying to access internal routes
    const internalRoutes = ['/dashboard', '/projects', '/leads', '/team', '/partners', '/statistics', '/settings', '/commissions']
    const isInternalRoute = internalRoutes.some(r => pathname.startsWith(r))
    if (role === 'external' && isInternalRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/portal'
      return NextResponse.redirect(url)
    }

    // Internal users trying to access external routes
    const externalRoutes = ['/portal', '/my-leads', '/account', '/submit-lead']
    const isExternalRoute = externalRoutes.some(r => pathname.startsWith(r))
    if (role !== 'external' && isExternalRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Sales member trying to access head-only routes
    const headOnlyRoutes = ['/team', '/partners', '/statistics', '/commissions']
    const isHeadOnly = headOnlyRoutes.some(r => pathname.startsWith(r))
    if (role === 'sales_member' && isHeadOnly) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
