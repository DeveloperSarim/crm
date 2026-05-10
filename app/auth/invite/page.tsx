'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

/**
 * Handles Supabase invite email links — supports both flows:
 *
 * 1. PKCE flow (default with @supabase/ssr):
 *    Supabase redirects here as: /auth/invite?code=xxx
 *    We call exchangeCodeForSession(code) then send to /reset-password.
 *
 * 2. Implicit flow (legacy / old invite emails):
 *    Supabase redirects here as: /auth/invite#access_token=xxx&type=invite
 *    We read the hash, call setSession(), then send to /reset-password.
 */
export default function InvitePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleInvite() {
      const supabase = createClient()

      // ── PKCE flow: ?code= in query string ──────────────────────────────
      const searchParams = new URLSearchParams(window.location.search)
      const code = searchParams.get('code')

      if (code) {
        const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeErr) {
          setError(exchangeErr.message)
          return
        }
        router.replace('/reset-password')
        return
      }

      // ── Implicit flow: #access_token= in URL hash ───────────────────────
      const hash = window.location.hash.slice(1)
      const hashParams = new URLSearchParams(hash)
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')

      if (!accessToken || !refreshToken) {
        setError('Invalid invite link — missing tokens. Please ask to be re-invited.')
        return
      }

      if (type !== 'invite' && type !== 'recovery') {
        setError('This link is not a valid invite link.')
        return
      }

      // Establish the session from the invite tokens
      const { error: sessionErr } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (sessionErr) {
        setError(sessionErr.message)
        return
      }

      // Session established — send to the password-setting page
      router.replace('/reset-password')
    }

    handleInvite()
  }, [router])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white font-sans p-6">
        <div className="w-full max-w-[380px] text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#FEF2F2]">
            <ShieldCheck size={22} className="text-[#B91C1C]" />
          </div>
          <h1 className="mb-2 text-[20px] font-semibold tracking-[-0.02em]">Invalid invite link</h1>
          <p className="mb-6 text-[13px] text-content-2">{error}</p>
          <Link
            href="/login"
            className="text-[13px] text-brand hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 size={22} className="animate-spin text-brand" />
        <p className="text-[13px] text-content-2">Setting up your account…</p>
      </div>
    </div>
  )
}
