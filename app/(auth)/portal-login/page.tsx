'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, ArrowRight, Loader2, Mail, KeyRound } from 'lucide-react'

const BULLETS = [
  'Submit leads for any listed project',
  'Track status in real-time',
  'Earn competitive commissions',
  'Dedicated support team',
]

export default function PortalLoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [ssoOpen, setSsoOpen] = useState(false)
  const [ssoEmail, setSsoEmail] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [ssoLoading, setSsoLoading] = useState(false)
  const [ssoError, setSsoError] = useState<string | null>(null)

  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return
    const params = new URLSearchParams(hash.slice(1))
    const type = params.get('type')
    const accessToken = params.get('access_token')
    if (accessToken && (type === 'invite' || type === 'recovery')) {
      window.location.replace('/auth/invite' + hash)
    }
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError(authError.message); setLoading(false); return }
    if (data.user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      if (profile?.role !== 'external') {
        setError('This portal is for external partners only. Please use the internal login.')
        setLoading(false)
        return
      }
      router.push('/portal')
      router.refresh()
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setSsoLoading(true)
    setSsoError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: ssoEmail,
      options: { shouldCreateUser: false },
    })
    if (error) { setSsoError(error.message); setSsoLoading(false); return }
    setOtpSent(true)
    setSsoLoading(false)
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setSsoLoading(true)
    setSsoError(null)
    const supabase = createClient()
    const { data, error } = await supabase.auth.verifyOtp({
      email: ssoEmail,
      token: otp.trim(),
      type: 'email',
    })
    if (error) { setSsoError(error.message); setSsoLoading(false); return }
    if (data.user) {
      router.push('/portal')
      router.refresh()
    }
  }

  function resetSso() {
    setSsoOpen(false)
    setSsoEmail('')
    setOtpSent(false)
    setOtp('')
    setSsoError(null)
  }

  return (
    <div className="flex min-h-screen font-sans">
      {/* ── Left: Dark branded panel ───────────────────────────────────────── */}
      <div
        className="hidden w-[400px] flex-none flex-col p-12 lg:flex"
        style={{ background: '#0B1220' }}
      >
        {/* Logo + badge */}
        <div className="mb-12">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] bg-white/10">
              <span className="text-[11px] font-bold text-white">R</span>
            </div>
            <span className="text-[15px] font-bold tracking-[-0.01em] text-white">Rayash</span>
          </div>
          <span className="rounded-[4px] bg-white/10 px-[7px] py-[2px] text-[11px] font-semibold text-[#94A3B8]">
            Realtor Portal
          </span>
        </div>

        {/* Headline */}
        <div className="flex-1">
          <h1 className="mb-3 text-[26px] font-bold leading-tight tracking-[-0.03em] text-white">
            Partner with us.<br />Earn more.
          </h1>
          <p className="mb-8 text-[14px] leading-relaxed text-[#94A3B8]">
            Access our exclusive project portfolio and earn competitive commissions on every closed deal.
          </p>

          {/* Feature bullets */}
          <div className="space-y-3.5">
            {BULLETS.map(b => (
              <div key={b} className="flex items-center gap-3 text-[13px] text-[#CBD5E1]">
                <div className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full bg-[#22C55E]">
                  <span className="text-[10px] font-bold text-white">✓</span>
                </div>
                {b}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-[12px] text-[#475569]">
          Already a partner?{' '}
          <a href="mailto:partners@ror.sa" className="text-[#64748B] hover:text-[#94A3B8]">
            Contact us
          </a>
        </p>
      </div>

      {/* ── Right: Sign-in form ────────────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center bg-white px-6 py-10 sm:px-10">
        <div className="w-full max-w-[360px]">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] bg-gradient-to-b from-[#111827] to-[#374151]">
              <span className="text-[11px] font-bold text-white">R</span>
            </div>
            <span className="text-[13px] font-semibold text-[#111827]">Rayash Realtor Portal</span>
          </div>

          <h2 className="mb-1 text-[22px] font-bold tracking-[-0.02em] text-[#111827]">Sign in</h2>
          <p className="mb-7 text-[14px] text-[#6B7280]">to your realtor account</p>

          {/* OTP option */}
          {!ssoOpen ? (
            <button
              type="button"
              onClick={() => setSsoOpen(true)}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-[7px] border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-[13.5px] font-medium text-[#374151] hover:bg-[#F9FAFB]"
            >
              <Mail size={14} className="text-[#9CA3AF]" />
              Sign in with OTP (no password)
            </button>
          ) : (
            <div className="mb-4 rounded-[8px] border border-[#2563EB]/30 bg-[#F8FAFF] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-[#111827]">
                  {otpSent ? 'Enter the code' : 'OTP sign in'}
                </span>
                <button onClick={resetSso} className="text-[12px] text-[#9CA3AF] hover:text-[#6B7280]">Cancel</button>
              </div>

              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="flex flex-col gap-2.5">
                  <input
                    type="email"
                    value={ssoEmail}
                    onChange={e => setSsoEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    autoFocus
                    className="rounded-[7px] border border-[#E5E7EB] bg-white px-2.5 py-2 text-[13px] outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_3px_#EFF4FE]"
                  />
                  {ssoError && <p className="text-[12px] text-[#B91C1C]">{ssoError}</p>}
                  <button
                    type="submit"
                    disabled={ssoLoading}
                    className="flex items-center justify-center gap-2 rounded-[6px] bg-[#2563EB] py-2 text-[13px] font-medium text-white disabled:opacity-60"
                  >
                    {ssoLoading ? <><Loader2 size={13} className="animate-spin" /> Sending…</> : 'Send code to email'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-2.5">
                  <p className="text-[12px] text-[#6B7280]">
                    We sent a 6-digit code to <strong>{ssoEmail}</strong>.
                  </p>
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    required
                    autoFocus
                    maxLength={6}
                    inputMode="numeric"
                    className="rounded-[7px] border border-[#E5E7EB] bg-white px-2.5 py-2 text-center font-mono text-[18px] tracking-[0.3em] outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_3px_#EFF4FE]"
                  />
                  {ssoError && <p className="text-[12px] text-[#B91C1C]">{ssoError}</p>}
                  <button
                    type="submit"
                    disabled={ssoLoading || otp.length < 6}
                    className="flex items-center justify-center gap-2 rounded-[6px] bg-[#2563EB] py-2 text-[13px] font-medium text-white disabled:opacity-60"
                  >
                    {ssoLoading
                      ? <><Loader2 size={13} className="animate-spin" /> Verifying…</>
                      : <><KeyRound size={13} /> Verify & sign in</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(''); setSsoError(null) }}
                    className="text-center text-[12px] text-[#2563EB] hover:underline"
                  >
                    Use a different email
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="my-4 flex items-center gap-2.5 text-[11.5px] text-[#9CA3AF]">
            <div className="h-px flex-1 bg-[#E5E7EB]" />
            OR
            <div className="h-px flex-1 bg-[#E5E7EB]" />
          </div>

          {/* Password form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <label className="flex flex-col gap-[5px]">
              <span className="text-[12px] font-medium text-[#6B7280]">Email address</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="rounded-[7px] border border-[#E5E7EB] bg-white px-2.5 py-2.5 text-[13.5px] text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#2563EB] focus:shadow-[0_0_0_3px_#EFF4FE]"
              />
            </label>

            <label className="flex flex-col gap-[5px]">
              <span className="flex items-center justify-between text-[12px] font-medium text-[#6B7280]">
                <span>Password</span>
                <Link href="/forgot-password" className="font-normal text-[#2563EB] hover:underline">
                  Forgot?
                </Link>
              </span>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-[7px] border border-[#E5E7EB] bg-white px-2.5 py-2.5 pr-9 text-[13.5px] text-[#111827] outline-none placeholder:text-[#9CA3AF] focus:border-[#2563EB] focus:shadow-[0_0_0_3px_#EFF4FE]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </label>

            {error && (
              <div className="rounded-[6px] bg-[#FEF2F2] px-3 py-2 text-[12.5px] text-[#B91C1C]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex items-center justify-center gap-2 rounded-[7px] bg-[#2563EB] px-3.5 py-2.5 text-[13.5px] font-medium text-white transition-opacity hover:bg-[#1D4ED8] disabled:opacity-60"
            >
              {loading
                ? <><Loader2 size={14} className="animate-spin" /> Signing in…</>
                : <>Sign in <ArrowRight size={14} /></>}
            </button>
          </form>

          <div className="mt-6 border-t border-[#E5E7EB] pt-5 text-center text-[12.5px] text-[#9CA3AF]">
            Internal team?{' '}
            <Link href="/login" className="text-[#2563EB] hover:underline">
              Use internal login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
