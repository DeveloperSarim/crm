'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'

export function InviteMemberButton() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('sales_member')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: name, role }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setOpen(false)
      setEmail(''); setName('')
    } catch {
      setError('Failed to send invite')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-[6px] bg-brand px-2.5 py-[5px] text-[13px] font-medium text-white shadow-[0_1px_0_rgba(0,0,0,0.04)]"
      >
        <Plus size={13} /> Invite member
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,24,39,0.25)] backdrop-blur-[2px]" onClick={() => setOpen(false)}>
          <div className="w-96 rounded-[12px] border border-border bg-white p-6 shadow-[0_20px_50px_rgba(17,24,39,0.15)]" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold">Invite team member</h2>
              <button onClick={() => setOpen(false)} className="text-content-3 hover:text-content-2"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-content-2">Full name</label>
                <input value={name} onChange={e => setName(e.target.value)} required placeholder="Neha Sharma"
                  className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-content-2">Work email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} required type="email" placeholder="neha@ror.sa"
                  className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-content-2">Role</label>
                <select value={role} onChange={e => setRole(e.target.value)}
                  className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50">
                  <option value="sales_member">Sales Member</option>
                  <option value="head">Head / Admin</option>
                </select>
              </div>
              {error && <p className="text-[12px] text-[#EF4444]">{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)}
                  className="rounded-[7px] border border-border px-4 py-2 text-[13px] font-medium text-content hover:bg-surface-2">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="rounded-[7px] bg-brand px-4 py-2 text-[13px] font-medium text-white disabled:opacity-60">
                  {loading ? 'Sending…' : 'Send invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
