'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-2 p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-white p-10 shadow-sm">
        <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-content-2 hover:text-content">
          <ArrowLeft size={13} /> Back to sign in
        </Link>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Reset your password</h1>
        <p className="mt-1.5 mb-6 text-[13px] text-content-2">
          Enter your work email and we'll send a reset link.
        </p>
        {sent ? (
          <div className="rounded-[8px] border border-[#DCFCE7] bg-status-green-bg p-4 text-[13px] text-[#166534]">
            Check your inbox — we've sent a password reset link to <strong>{email}</strong>.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-[5px]">
              <span className="text-[12px] font-medium text-content-2">Work email</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@ror.sa"
                required
                className="rounded-[7px] border border-border bg-white px-2.5 py-2 text-[13.5px] outline-none transition-all placeholder:text-content-3 focus:border-brand focus:shadow-[0_0_0_3px_#EFF4FE]"
              />
            </label>
            {error && <p className="text-[12.5px] text-[#B91C1C]">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-[6px] bg-brand px-4 py-2.5 text-[13.5px] font-medium text-white disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
