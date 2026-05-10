'use client'

import { useState, useTransition } from 'react'
import { updateMember } from '@/lib/actions/partners'
import { Pencil, X, Loader2, Check } from 'lucide-react'

interface Member {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: string
}

const inputCls = 'w-full rounded-[7px] border border-[#E5E7EB] px-3 py-2 text-[13px] text-[#111827] outline-none transition-shadow focus:border-[#2563EB]/60 focus:ring-2 focus:ring-[#2563EB]/15'

export function EditMemberButton({ member }: { member: Member }) {
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState(member.full_name ?? '')
  const [email, setEmail] = useState(member.email ?? '')
  const [phone, setPhone] = useState(member.phone ?? '')
  const [role, setRole] = useState<'head' | 'sales_member'>(
    member.role === 'head' ? 'head' : 'sales_member'
  )
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  function openModal() {
    setFullName(member.full_name ?? '')
    setEmail(member.email ?? '')
    setPhone(member.phone ?? '')
    setRole(member.role === 'head' ? 'head' : 'sales_member')
    setError(null)
    setDone(false)
    setOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await updateMember(member.id, { full_name: fullName, email, phone, role })
      if (res?.error) { setError(res.error); return }
      setDone(true)
      setTimeout(() => setOpen(false), 900)
    })
  }

  return (
    <>
      <button
        onClick={openModal}
        className="rounded-[5px] border border-border px-2 py-1 text-[12px] text-content-2 hover:bg-surface-2"
      >
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
                <div className="text-[14px] font-semibold text-[#111827]">Edit member</div>
                <div className="mt-0.5 text-[12px] text-[#9CA3AF]">{member.full_name}</div>
              </div>
              <button onClick={() => setOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-full text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#374151]">
                <X size={15} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-[#374151]">Full name <span className="text-red-400">*</span></label>
                <input value={fullName} onChange={e => setFullName(e.target.value)} required className={inputCls} placeholder="Full name" />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-[#374151]">Email <span className="text-red-400">*</span></label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputCls} />
                <p className="mt-1 text-[11px] text-[#9CA3AF]">Changing this updates their login email.</p>
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-[#374151]">Phone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls + ' font-mono text-[12.5px]'} placeholder="+966 50 000 0000" />
              </div>

              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-[#374151]">Role</label>
                <div className="inline-flex rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] p-[3px]">
                  {(['sales_member', 'head'] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={[
                        'rounded-[6px] px-4 py-[5px] text-[12.5px] font-medium transition-all',
                        role === r
                          ? 'bg-white text-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                          : 'text-[#6B7280] hover:text-[#374151]',
                      ].join(' ')}
                    >
                      {r === 'head' ? 'Head / Admin' : 'Sales Member'}
                    </button>
                  ))}
                </div>
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
