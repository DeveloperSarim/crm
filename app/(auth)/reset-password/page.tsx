'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'

type State = 'loading' | 'ready' | 'success' | 'error'

export default function ResetPasswordPage() {
  const router = useRouter()
  const loginHref = '/login'
  const [state, setState] = useState<State>('loading')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Verify there is an active recovery session before showing the form.
  // After /auth/callback runs, Supabase will have set session cookies —
  // we just need to confirm the user object is present.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setState('ready')
      } else {
        setState('error')
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setSubmitting(false)
      return
    }

    setState('success')
    // Sign out so they land fresh on the correct login page
    await supabase.auth.signOut()
    setTimeout(() => router.push(loginHref), 2500)
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 size={22} className="animate-spin text-content-3" />
      </div>
    )
  }

  // ── Invalid / expired link ────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white font-sans p-6">
        <div className="w-full max-w-[380px] text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-status-red-bg">
            <ShieldCheck size={22} className="text-[#B91C1C]" />
          </div>
          <h1 className="mb-2 text-[20px] font-semibold tracking-[-0.02em]">Link expired</h1>
          <p className="mb-6 text-[13px] text-content-2">
            This password reset link has expired or already been used. Please request a new one.
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center rounded-[8px] bg-brand px-5 py-2.5 text-[13.5px] font-medium text-white hover:bg-brand/90"
          >
            Request new link
          </Link>
          <div className="mt-4">
            <Link href={loginHref} className="text-[12.5px] text-brand hover:underline">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (state === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white font-sans p-6">
        <div className="w-full max-w-[380px] text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#DCFCE7]">
            <CheckCircle2 size={22} className="text-[#16A34A]" />
          </div>
          <h1 className="mb-2 text-[20px] font-semibold tracking-[-0.02em]">Password updated!</h1>
          <p className="text-[13px] text-content-2">
            Your password has been changed. Redirecting you to sign in…
          </p>
          <div className="mt-4">
            <Link href={loginHref} className="text-[12.5px] text-brand hover:underline">
              Go to sign in now
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center bg-white font-sans p-6">
      <div className="w-full max-w-[380px]">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="relative flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[6px] bg-gradient-to-b from-[#111827] to-[#374151]">
            <span className="text-[11px] font-bold tracking-tight text-white">R</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-semibold tracking-tight text-content">Rayash</span>
            <span className="text-[10.5px] text-content-2">Real Estate</span>
          </div>
        </div>

        <h1 className="mb-1.5 text-center text-[22px] font-semibold tracking-[-0.02em]">
          Set new password
        </h1>
        <p className="mb-7 text-center text-[13px] text-content-2">
          Choose a strong password for your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* New password */}
          <div>
            <label className="mb-1 block text-[12.5px] font-medium text-content-2">
              New password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="At least 8 characters"
                className="w-full rounded-[8px] border border-border px-3.5 py-2.5 pr-10 text-[13.5px] outline-none transition-all placeholder:text-content-3 focus:border-brand focus:shadow-[0_0_0_3px_#EFF4FE]"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-content-3 hover:text-content-2"
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="mb-1 block text-[12.5px] font-medium text-content-2">
              Confirm password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                placeholder="Repeat your new password"
                className="w-full rounded-[8px] border border-border px-3.5 py-2.5 pr-10 text-[13.5px] outline-none transition-all placeholder:text-content-3 focus:border-brand focus:shadow-[0_0_0_3px_#EFF4FE]"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-content-3 hover:text-content-2"
              >
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Password strength hint */}
          {password.length > 0 && (
            <div className="flex items-center gap-2">
              {['Weak', 'Fair', 'Strong', 'Very strong'].map((label, i) => {
                const score =
                  password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) ? 3
                  : password.length >= 10 && /[A-Z]/.test(password) ? 2
                  : password.length >= 8 ? 1
                  : 0
                const colors = ['bg-[#EF4444]', 'bg-[#F59E0B]', 'bg-[#10B981]', 'bg-[#047857]']
                return (
                  <div
                    key={label}
                    className={`h-1 flex-1 rounded-full transition-all ${i <= score ? colors[score] : 'bg-[#E5E7EB]'}`}
                  />
                )
              })}
              <span className="text-[11.5px] text-content-3 w-16">
                {password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) ? 'Very strong'
                  : password.length >= 10 && /[A-Z]/.test(password) ? 'Strong'
                  : password.length >= 8 ? 'Fair'
                  : 'Weak'}
              </span>
            </div>
          )}

          {/* Match indicator */}
          {confirm.length > 0 && (
            <p className={`text-[12px] ${password === confirm ? 'text-[#16A34A]' : 'text-[#B91C1C]'}`}>
              {password === confirm ? '✓ Passwords match' : '✗ Passwords do not match'}
            </p>
          )}

          {error && (
            <div className="rounded-[6px] bg-status-red-bg px-3 py-2 text-[12.5px] text-[#B91C1C]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !password || !confirm}
            className="mt-1 w-full rounded-[8px] bg-brand py-2.5 text-[13.5px] font-medium text-white shadow-[0_1px_0_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-brand/90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity inline-flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><Loader2 size={14} className="animate-spin" /> Updating…</>
            ) : (
              'Update password'
            )}
          </button>
        </form>

        <div className="mt-5 text-center">
          <Link href={loginHref} className="text-[12.5px] text-brand hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
