'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, ArrowRight, Loader2, Mail, KeyRound } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()

  // ── Email + password form state ──────────────────────────────────────────
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── OTP / SSO flow state ─────────────────────────────────────────────────
  const [ssoOpen, setSsoOpen] = useState(false)
  const [ssoEmail, setSsoEmail] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [ssoLoading, setSsoLoading] = useState(false)
  const [ssoError, setSsoError] = useState<string | null>(null)

  // ── Intercept invite / recovery hash tokens on this page ────────────────
  // Supabase invite emails may still redirect here with #type=invite in the
  // hash (if the email template was sent before the redirectTo was updated).
  // Detect this and forward to /auth/invite so the user can set a password.
  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return
    const params = new URLSearchParams(hash.slice(1))
    const type = params.get('type')
    const accessToken = params.get('access_token')
    if (accessToken && (type === 'invite' || type === 'recovery')) {
      // Preserve the full hash so /auth/invite can read the tokens
      window.location.replace('/auth/invite' + hash)
    }
  }, [])

  // ── Password login ───────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError(authError.message); setLoading(false); return }
    if (data.user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      router.push(profile?.role === 'external' ? '/portal' : '/dashboard')
      router.refresh()
    }
  }

  // ── OTP: send code ───────────────────────────────────────────────────────
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setSsoLoading(true)
    setSsoError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: ssoEmail,
      options: { shouldCreateUser: false }, // only allow existing users
    })
    if (error) { setSsoError(error.message); setSsoLoading(false); return }
    setOtpSent(true)
    setSsoLoading(false)
  }

  // ── OTP: verify code ─────────────────────────────────────────────────────
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
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      router.push(profile?.role === 'external' ? '/portal' : '/dashboard')
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
    <div className="flex h-screen bg-white font-sans text-content">
      {/* ── Left: Form ────────────────────────────────────────────────────── */}
      <div className="flex w-[480px] flex-none flex-col justify-between p-10 px-14">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="relative flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[6px] bg-gradient-to-b from-[#111827] to-[#374151]">
            <span className="text-[11px] font-bold tracking-tight text-white">R</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[13px] font-semibold tracking-tight text-content">Rayash</span>
            <span className="text-[10.5px] text-content-2">Real Estate</span>
          </div>
        </div>

        {/* Form */}
        <div className="mx-auto w-full max-w-[360px]">
          <div className="mb-2.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-content-3">
            Internal workspace
          </div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em]">
            Sign in to Rayash
          </h1>
          <p className="mt-2 mb-7 text-[13.5px] leading-[1.55] text-content-2">
            Continue with your work email and password, or use OTP to sign in without a password.
          </p>

          {/* ── SSO / OTP Panel ─────────────────────────────────────────── */}
          {!ssoOpen ? (
            <button
              type="button"
              onClick={() => setSsoOpen(true)}
              className="mb-3.5 flex w-full items-center justify-center gap-2.5 rounded-[6px] border border-border bg-white px-3.5 py-2.5 text-[13.5px] font-medium text-content transition-colors hover:bg-surface-2"
            >
              <Mail size={14} className="text-content-2" />
              Sign in with OTP (no password)
            </button>
          ) : (
            <div className="mb-3.5 rounded-[8px] border border-brand/30 bg-[#F8FAFF] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-content">
                  {otpSent ? 'Enter the code' : 'OTP sign in'}
                </span>
                <button onClick={resetSso} className="text-[12px] text-content-3 hover:text-content-2">Cancel</button>
              </div>

              {!otpSent ? (
                /* Step 1: enter email */
                <form onSubmit={handleSendOtp} className="flex flex-col gap-2.5">
                  <input
                    type="email"
                    value={ssoEmail}
                    onChange={e => setSsoEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    autoFocus
                    className="rounded-[7px] border border-border bg-white px-2.5 py-2 text-[13px] outline-none focus:border-brand focus:shadow-[0_0_0_3px_#EFF4FE]"
                  />
                  {ssoError && <p className="text-[12px] text-[#B91C1C]">{ssoError}</p>}
                  <button
                    type="submit"
                    disabled={ssoLoading}
                    className="flex items-center justify-center gap-2 rounded-[6px] bg-brand py-2 text-[13px] font-medium text-white disabled:opacity-60"
                  >
                    {ssoLoading
                      ? <><Loader2 size={13} className="animate-spin" /> Sending…</>
                      : 'Send code to email'}
                  </button>
                </form>
              ) : (
                /* Step 2: enter OTP */
                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-2.5">
                  <p className="text-[12px] text-content-2">
                    We sent a 6-digit code to <strong>{ssoEmail}</strong>. Check your inbox.
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
                    className="rounded-[7px] border border-border bg-white px-2.5 py-2 text-center font-tabular text-[18px] tracking-[0.3em] outline-none focus:border-brand focus:shadow-[0_0_0_3px_#EFF4FE]"
                  />
                  {ssoError && <p className="text-[12px] text-[#B91C1C]">{ssoError}</p>}
                  <button
                    type="submit"
                    disabled={ssoLoading || otp.length < 6}
                    className="flex items-center justify-center gap-2 rounded-[6px] bg-brand py-2 text-[13px] font-medium text-white disabled:opacity-60"
                  >
                    {ssoLoading
                      ? <><Loader2 size={13} className="animate-spin" /> Verifying…</>
                      : <><KeyRound size={13} /> Verify & sign in</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(''); setSsoError(null) }}
                    className="text-center text-[12px] text-brand hover:underline"
                  >
                    Use a different email
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="my-3.5 flex items-center gap-2.5 text-[11.5px] text-content-3">
            <div className="h-px flex-1 bg-border" />
            OR
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* ── Password form ────────────────────────────────────────────── */}
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <label className="flex flex-col gap-[5px]">
              <span className="text-[12px] font-medium text-content-2">Work email</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@ror.sa"
                required
                className="rounded-[7px] border border-border bg-white px-2.5 py-2 text-[13.5px] text-content outline-none transition-all placeholder:text-content-3 focus:border-brand focus:shadow-[0_0_0_3px_#EFF4FE]"
              />
            </label>

            <label className="flex flex-col gap-[5px]">
              <span className="flex items-center justify-between text-[12px] font-medium text-content-2">
                <span>Password</span>
                <Link href="/forgot-password" className="font-normal text-brand hover:underline">
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
                  className="w-full rounded-[7px] border border-border bg-white px-2.5 py-2 pr-9 text-[13.5px] text-content outline-none transition-all placeholder:text-content-3 focus:border-brand focus:shadow-[0_0_0_3px_#EFF4FE]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-content-3 hover:text-content-2"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </label>

            {error && (
              <div className="rounded-[6px] bg-status-red-bg px-3 py-2 text-[12.5px] text-[#B91C1C]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1.5 flex items-center justify-center gap-2 rounded-[6px] bg-brand px-3.5 py-2.5 text-[13.5px] font-medium text-white shadow-[0_1px_0_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.12)] transition-opacity disabled:opacity-60"
            >
              {loading ? <><Loader2 size={14} className="animate-spin" /> Signing in…</> : <>Sign in <ArrowRight size={14} /></>}
            </button>
          </form>

          <div className="mt-5 text-center text-[12.5px] text-content-2">
            Channel partner?{' '}
            <Link href="/partner/login" className="text-brand hover:underline">
              Open the Realtor Portal →
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[11.5px] text-content-3">
          <span>© Rayash Real Estate 2026</span>
          <span className="flex gap-3.5">
            <a href="#" className="hover:text-content-2">Privacy</a>
            <a href="#" className="hover:text-content-2">Status</a>
          </span>
        </div>
      </div>

      {/* ── Right: Branded panel ──────────────────────────────────────────── */}
      <div
        className="relative flex-1 overflow-hidden border-l border-border bg-surface-2"
        style={{
          backgroundImage:
            `radial-gradient(at 20% 30%, #EFF4FE 0, transparent 55%),` +
            `radial-gradient(at 80% 80%, #F5F3FF 0, transparent 50%)`,
        }}
      >
        <div className="absolute right-[-40px] top-20 left-14 overflow-hidden rounded-xl border border-border bg-white shadow-[0_24px_60px_rgba(17,24,39,0.10),_0_6px_14px_rgba(17,24,39,0.04)]">
          <div className="flex h-8 items-center gap-1.5 border-b border-border bg-surface-3 px-3">
            <span className="h-[9px] w-[9px] rounded-full bg-border" />
            <span className="h-[9px] w-[9px] rounded-full bg-border" />
            <span className="h-[9px] w-[9px] rounded-full bg-border" />
            <span className="ml-3.5 font-mono text-[11px] text-content-3">app.ror.sa/leads</span>
          </div>
          <div className="p-[14px_18px]">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-[13px] font-semibold">Marina Heights · Leads</span>
              <StatusDot kind="active" />
            </div>
            <div className="mb-3.5 flex flex-wrap gap-1.5">
              {['Apartment', 'Villa', 'Commercial', 'Land'].map((t, i) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-[6px] border px-2 py-[3px] text-[11.5px]"
                  style={{
                    background: i === 0 ? '#111827' : '#fff',
                    color: i === 0 ? '#fff' : '#6B7280',
                    borderColor: i === 0 ? '#111827' : '#E5E7EB',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
            {[
              ['Priya Raghavan', 'Apartment · 3BHK', 'new'],
              ['Daniel Cortez', 'Villa · 4BHK', 'interested'],
              ['Sana Qureshi', 'Apartment · 2BHK', 'site_visit'],
              ['Linh Tran', 'Apartment · 2BHK', 'closed_won'],
            ].map(([name, tag, status]) => (
              <div key={name} className="flex items-center gap-2.5 border-t border-border/50 py-2 text-[12.5px]">
                <RAvatar name={name} size={20} />
                <span className="flex-1 font-medium">{name}</span>
                <span className="text-content-2">{tag}</span>
                <StatusDot kind={status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusDot({ kind }: { kind: string }) {
  const map: Record<string, { bg: string; fg: string; dot: string; label: string }> = {
    new: { bg: '#EFF6FF', fg: '#1D4ED8', dot: '#3B82F6', label: 'New' },
    interested: { bg: '#F5F3FF', fg: '#6D28D9', dot: '#8B5CF6', label: 'Interested' },
    site_visit: { bg: '#FFFBEB', fg: '#B45309', dot: '#F59E0B', label: 'Site Visit' },
    closed_won: { bg: '#ECFDF5', fg: '#047857', dot: '#10B981', label: 'Closed Won' },
    active: { bg: '#ECFDF5', fg: '#047857', dot: '#10B981', label: 'Active' },
  }
  const s = map[kind] || map.new
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[6px] px-2 py-[2px] text-[12px] font-medium"
      style={{ background: s.bg, color: s.fg }}
    >
      <span className="h-[6px] w-[6px] rounded-full" style={{ background: s.dot }} />
      {s.label}
    </span>
  )
}

function RAvatar({ name, size = 22 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
  const palettes = [
    { bg: '#FCE7F3', fg: '#9D174D' }, { bg: '#DBEAFE', fg: '#1E40AF' },
    { bg: '#DCFCE7', fg: '#166534' }, { bg: '#FEF3C7', fg: '#92400E' },
    { bg: '#EDE9FE', fg: '#5B21B6' },
  ]
  const p = palettes[name.charCodeAt(0) % palettes.length]
  return (
    <span
      className="inline-flex flex-none items-center justify-center rounded-full font-semibold"
      style={{ width: size, height: size, background: p.bg, color: p.fg, fontSize: Math.round(size * 0.42) }}
    >
      {initials}
    </span>
  )
}
