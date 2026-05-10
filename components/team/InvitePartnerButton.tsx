'use client'

import { useState } from 'react'
import { Plus, X, UserPlus, Check } from 'lucide-react'

const inputCls =
  'w-full rounded-[7px] border border-[#E5E7EB] px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]/50 focus:ring-1 focus:ring-[#2563EB]/20'

export function InvitePartnerButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')

  function handleClose() {
    setOpen(false)
    // reset after animation
    setTimeout(() => {
      setName(''); setEmail(''); setCompany(''); setPhone('')
      setError(''); setDone(false)
    }, 300)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          full_name: name,
          role: 'external',
          company_name: company || undefined,
          phone: phone || undefined,
        }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setDone(true)
      setTimeout(handleClose, 2200)
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#2563EB] px-2.5 py-[5px] text-[13px] font-medium text-white shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:bg-[#1D4ED8] transition-colors"
      >
        <UserPlus size={13} />
        Invite partner
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,24,39,0.28)] backdrop-blur-[2px]"
          onClick={handleClose}
        >
          <div
            className="w-[420px] rounded-[14px] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_60px_rgba(17,24,39,0.14)]"
            onClick={e => e.stopPropagation()}
          >
            {done ? (
              /* Success state */
              <div className="flex flex-col items-center py-4 text-center">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#ECFDF5]">
                  <Check size={18} className="text-[#10B981]" />
                </div>
                <div className="text-[15px] font-semibold text-[#111827]">Invite sent!</div>
                <p className="mt-1 text-[13px] text-[#6B7280]">
                  <span className="font-medium text-[#111827]">{name}</span> will receive an email to set up their account.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-[15px] font-semibold text-[#111827]">Invite a partner</h2>
                    <p className="mt-0.5 text-[12.5px] text-[#6B7280]">
                      They&apos;ll get an email to set their password and access the Realtor Portal.
                    </p>
                  </div>
                  <button onClick={handleClose} className="text-[#9CA3AF] hover:text-[#6B7280]">
                    <X size={15} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[12px] font-medium text-[#374151]">
                        Full name <span className="text-[#EF4444]">*</span>
                      </label>
                      <input
                        value={name} onChange={e => setName(e.target.value)}
                        required placeholder="Ahmed Al-Rashid"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[12px] font-medium text-[#374151]">
                        Channel / company
                      </label>
                      <input
                        value={company} onChange={e => setCompany(e.target.value)}
                        placeholder="Al-Rashid Realty"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-[#374151]">
                      Work email <span className="text-[#EF4444]">*</span>
                    </label>
                    <input
                      value={email} onChange={e => setEmail(e.target.value)}
                      required type="email" placeholder="ahmed@alrashid.sa"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-[#374151]">Phone</label>
                    <input
                      value={phone} onChange={e => setPhone(e.target.value)}
                      type="tel" placeholder="+966 5x xxx xxxx"
                      className={inputCls + ' font-mono text-[12.5px]'}
                    />
                  </div>

                  {/* Commission info note */}
                  <div className="rounded-[8px] border border-[#E5E7EB] bg-[#FAFAFB] px-3.5 py-2.5 text-[12px] text-[#6B7280]">
                    Partner will receive <span className="font-medium text-[#111827]">1.25% channel commission</span> on
                    each closed lead, locked to their channel for 30 days.
                  </div>

                  {error && (
                    <p className="rounded-[6px] bg-[#FEF2F2] px-3 py-2 text-[12px] text-[#B91C1C]">{error}</p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button" onClick={handleClose}
                      className="rounded-[7px] border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-medium text-[#374151] hover:bg-[#F9FAFB]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit" disabled={loading}
                      className="inline-flex items-center gap-1.5 rounded-[7px] bg-[#2563EB] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#1D4ED8] disabled:opacity-60"
                    >
                      {loading ? (
                        <><span className="h-3.5 w-3.5 animate-spin rounded-full border border-white/40 border-t-white" /> Sending…</>
                      ) : (
                        <><Plus size={13} /> Send invite</>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
