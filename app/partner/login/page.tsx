'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, ArrowRight, Loader2, Check } from 'lucide-react'

const BULLETS = [
  'Lead lock for 30 days',
  'Buy or Rent submissions',
  'Real-time status updates',
  'Channel commission of 1.25%',
]

export default function PartnerLoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [otpMode, setOtpMode] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) router.replace('/portal')
    })
    // Show banner if redirected here due to expired invite link
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('error') === 'link_expired') {
        setError('Your invite link has expired or already been used. Please contact your account manager.')
      }
    }
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError(authError.message); setLoading(false); return }
    if (data.user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      if (profile?.role !== 'external') {
        await supabase.auth.signOut()
        setError('This portal is for external partners only. Internal staff: use the staff login.')
        setLoading(false); return
      }
      router.replace('/portal'); router.refresh()
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setOtpLoading(true); setOtpError(null)
    const { error } = await createClient().auth.signInWithOtp({ email: otpEmail, options: { shouldCreateUser: false } })
    if (error) { setOtpError(error.message); setOtpLoading(false); return }
    setOtpSent(true); setOtpLoading(false)
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setOtpLoading(true); setOtpError(null)
    const { data, error } = await createClient().auth.verifyOtp({ email: otpEmail, token: otp.trim(), type: 'email' })
    if (error) { setOtpError(error.message); setOtpLoading(false); return }
    if (data.user) { router.replace('/portal'); router.refresh() }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    border: '1px solid #E5E7EB', borderRadius: 8,
    padding: '9px 12px', fontSize: 13.5, color: '#111827',
    outline: 'none', background: '#fff', fontFamily: 'inherit',
  }

  const btnPrimary: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8,
    padding: '11px 14px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
    fontFamily: 'inherit', width: '100%',
  }

  return (
    <>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        .pcard { display: grid; grid-template-columns: 1.05fr 1fr; }
        @media (max-width: 620px) {
          .pcard { grid-template-columns: 1fr; }
          .pbrand { min-height: 200px !important; }
        }
        .pinput:focus { border-color: #2563EB !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
      `}</style>

      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 16px', background: '#F3F4F6', fontFamily: 'Inter, sans-serif',
      }}>
        <div className="pcard" style={{
          width: '100%', maxWidth: 880,
          background: '#fff', border: '1px solid #E5E7EB',
          borderRadius: 14, overflow: 'hidden',
          boxShadow: '0 24px 60px rgba(17,24,39,0.10)',
        }}>

          {/* ── Left: dark brand panel ─────────────────────────────── */}
          <div className="pbrand" style={{
            padding: '40px 36px', background: '#0B1220',
            color: '#fff', display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between', position: 'relative',
            overflow: 'hidden', minHeight: 440,
          }}>
            {/* Blue/purple gradient blobs */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              backgroundImage: [
                'radial-gradient(at 20% 0%, rgba(59,130,246,0.35) 0, transparent 55%)',
                'radial-gradient(at 100% 100%, rgba(139,92,246,0.25) 0, transparent 55%)',
              ].join(', '),
            }} />

            {/* Logo */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6, background: '#fff', color: '#0B1220',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 11, flexShrink: 0,
              }}>R</div>
              <span style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.01em' }}>
                Rayash · Realtor Portal
              </span>
            </div>

            {/* Headline + bullets */}
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 14 }}>
                Submit leads in 30 seconds.<br />Track them to close.
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {BULLETS.map(t => (
                  <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>
                    <span style={{
                      width: 17, height: 17, borderRadius: 9,
                      background: 'rgba(16,185,129,0.18)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Check size={10} color="#34D399" strokeWidth={2.5} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Bottom */}
            <div style={{ position: 'relative', fontSize: 11.5, color: 'rgba(255,255,255,0.55)' }}>
              New here?{' '}
              <a href="mailto:partners@ror.sa" style={{ color: '#fff', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.4)' }}>
                Apply to become a partner →
              </a>
            </div>
          </div>

          {/* ── Right: sign-in form ────────────────────────────────── */}
          <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column' }}>

            <div style={{ fontSize: 11.5, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600, marginBottom: 10 }}>
              Partner sign in
            </div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#111827', letterSpacing: '-0.02em' }}>
              Welcome back
            </h2>
            <p style={{ margin: '6px 0 24px', color: '#6B7280', fontSize: 13 }}>
              Use the email registered to your channel.
            </p>

            {/* ── Password form ───────────────────────────────────── */}
            {!otpMode ? (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#374151', marginBottom: 5 }}>
                    Channel email
                  </label>
                  <input
                    className="pinput"
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com" required
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#374151', marginBottom: 5 }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="pinput"
                      type={showPassword ? 'text' : 'password'}
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" required
                      style={{ ...inputStyle, paddingRight: 38 }}
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0, display: 'flex' }}>
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, color: '#6B7280' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
                    <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                      style={{ accentColor: '#2563EB', width: 14, height: 14 }} />
                    Remember this device
                  </label>
                  <Link href="/forgot-password" style={{ color: '#2563EB', textDecoration: 'none' }}>
                    Forgot password?
                  </Link>
                </div>

                {error && (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 7, padding: '9px 12px', fontSize: 12.5, color: '#B91C1C' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1, marginTop: 2 }}>
                  {loading
                    ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Signing in…</>
                    : <>Sign in <ArrowRight size={15} /></>}
                </button>

                {/* OTP alternative row */}
                <div onClick={() => { setOtpMode(true); setOtpEmail(email) }}
                  style={{ marginTop: 4, padding: '10px 12px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12.5, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', flexShrink: 0 }} />
                  <span>Need an OTP instead?{' '}<span style={{ color: '#2563EB' }}>Send code to email</span></span>
                </div>
              </form>

            ) : (
              /* ── OTP flow ───────────────────────────────────────── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>
                    {otpSent ? 'Enter your code' : 'Sign in with OTP'}
                  </span>
                  <button onClick={() => { setOtpMode(false); setOtpSent(false); setOtp(''); setOtpError(null) }}
                    style={{ fontSize: 12.5, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                    ← Back
                  </button>
                </div>

                {!otpSent ? (
                  <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 500, color: '#374151', marginBottom: 5 }}>Channel email</label>
                      <input className="pinput" type="email" value={otpEmail} onChange={e => setOtpEmail(e.target.value)}
                        placeholder="you@company.com" required autoFocus style={inputStyle} />
                    </div>
                    {otpError && <p style={{ fontSize: 12.5, color: '#B91C1C', margin: 0 }}>{otpError}</p>}
                    <button type="submit" disabled={otpLoading} style={{ ...btnPrimary, opacity: otpLoading ? 0.7 : 1 }}>
                      {otpLoading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</> : 'Send code to email'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <p style={{ fontSize: 12.5, color: '#6B7280', margin: 0 }}>Code sent to <strong>{otpEmail}</strong>. Check your inbox.</p>
                    <input className="pinput" type="text" value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456" required autoFocus maxLength={6} inputMode="numeric"
                      style={{ ...inputStyle, fontSize: 24, fontFamily: 'monospace', letterSpacing: '0.4em', textAlign: 'center', padding: '10px 12px' }} />
                    {otpError && <p style={{ fontSize: 12.5, color: '#B91C1C', margin: 0 }}>{otpError}</p>}
                    <button type="submit" disabled={otpLoading || otp.length < 6}
                      style={{ ...btnPrimary, opacity: otp.length < 6 ? 0.5 : 1 }}>
                      {otpLoading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Verifying…</> : 'Verify & sign in →'}
                    </button>
                    <button type="button" onClick={() => { setOtpSent(false); setOtp('') }}
                      style={{ fontSize: 12.5, color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' }}>
                      Use a different email
                    </button>
                  </form>
                )}
              </div>
            )}

            <div style={{ flex: 1 }} />
            <div style={{ marginTop: 24, fontSize: 11.5, color: '#9CA3AF', textAlign: 'center' }}>
              By signing in you agree to the{' '}
              <a href="#" style={{ color: '#9CA3AF', textDecoration: 'underline' }}>channel partner terms</a>.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
