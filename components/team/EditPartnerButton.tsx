'use client'

import { useState, useTransition } from 'react'
import { updatePartner } from '@/lib/actions/partners'
import { Pencil, X, Loader2, Check } from 'lucide-react'

interface Partner {
  id: string
  full_name: string
  email: string
  phone: string | null
  company_name: string | null
}

const inputCls = 'w-full rounded-[7px] border border-[#E5E7EB] px-3 py-2 text-[13px] text-[#111827] outline-none transition-shadow focus:border-[#2563EB]/60 focus:ring-2 focus:ring-[#2563EB]/15'

export function EditPartnerButton({ partner }: { partner: Partner }) {
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState(partner.full_name ?? '')
  const [email, setEmail] = useState(partner.email ?? '')
  const [phone, setPhone] = useState(partner.phone ?? '')
  const [company, setCompany] = useState(partner.company_name ?? '')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  function openModal() {
    setFullName(partner.full_name ?? '')
    setEmail(partner.email ?? '')
    setPhone(partner.phone ?? '')
    setCompany(partner.company_name ?? '')
    setError(null)
    setDone(false)
    setOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await updatePartner(partner.id, {
        full_name: fullName,
        email,
        phone,
        company_name: company,
      })
      if (res?.error) { setError(res.error); return }
      setDone(true)
      setTimeout(() => setOpen(false), 900)
    })
  }

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex items-center gap-1 rounded-[5px] border border-[#E5E7EB] px-2 py-1 text-[12px] text-[#6B7280] hover:bg-[#F9FAFB]"
      >
        <Pencil size={10} />
        Edit
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(17,24,39,0.45)', backdropFilter: 'blur(2px)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="w-full max-w-[420px] overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white shadow-[0_24px_60px_rgba(17,24,39,0.14)]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#EEF0F3] px-5 py-4">
              <div>
                <div className="text-[14px] font-semibold text-[#111827]">Edit partner</div>
                <div className="mt-0.5 text-[12px] text-[#9CA3AF]">{partner.full_name}</div>
              </div>
              <button onClick={() => setOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-full text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#374151]">
                <X size={15} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-[#374151]">Full name <span className="text-red-400">*</span></label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} required className={inputCls} placeholder="Jane Smith" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-[#374151]">Channel / company</label>
                  <input value={company} onChange={e => setCompany(e.target.value)} className={inputCls} placeholder="Realtor Co." />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-[#374151]">Email <span className="text-red-400">*</span></label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputCls} placeholder="partner@email.com" />
                <p className="mt-1 text-[11px] text-[#9CA3AF]">Changing this updates their login email — they'll need to use the new one next time.</p>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-[#374151]">Phone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls + ' font-mono text-[12.5px]'} placeholder="+966 50 000 0000" />
              </div>

              {error && (
                <div className="rounded-[7px] border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{error}</div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)}
                  className="rounded-[7px] border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-medium text-[#374151] hover:bg-[#F9FAFB]">
                  Cancel
                </button>
                <button type="submit" disabled={isPending || done}
                  className="inline-flex items-center gap-1.5 rounded-[7px] bg-[#2563EB] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#1D4ED8] disabled:opacity-70">
                  {done
                    ? <><Check size={13} /> Saved</>
                    : isPending
                      ? <><Loader2 size={13} className="animate-spin" /> Saving…</>
                      : 'Save changes'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
