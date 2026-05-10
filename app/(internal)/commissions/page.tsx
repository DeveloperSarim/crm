import { createClient } from '@/lib/supabase/server'
import { getAuthUser, getUserProfile } from '@/lib/supabase/cached'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { approveCommission, markCommissionPaid } from '@/lib/actions/leads'
import { SubmitButton } from '@/components/shared/SubmitButton'

// ── Page shell — renders instantly with cached auth ─────────────────────────
export default async function CommissionsPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const profile = await getUserProfile(user.id)
  if ((profile as any)?.role !== 'head') redirect('/dashboard')

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar crumbs={['Workspace', 'Commissions']} />
      <div className="flex-1 overflow-auto p-[16px_16px_24px] sm:p-7">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-[20px] font-semibold tracking-[-0.02em]">Commissions</h1>
        </div>

        <Suspense fallback={<CommissionsSkeleton />}>
          <CommissionsContent />
        </Suspense>
      </div>
    </div>
  )
}

// ── Helper functions ─────────────────────────────────────────────────────────
function CommissionStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-blue-50 text-blue-700 border-blue-200',
    paid: 'bg-green-50 text-green-700 border-green-200',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${styles[status] ?? 'bg-surface-2 text-content-2 border-border'}`}>
      {status}
    </span>
  )
}

function formatCurrency(val: number | null) {
  if (!val) return '—'
  return new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(val)
}

function CommissionRow({ c }: { c: any }) {
  const lead = Array.isArray(c.lead) ? c.lead[0] : c.lead
  const realtor = Array.isArray(c.realtor) ? c.realtor[0] : c.realtor
  const project = Array.isArray(lead?.project) ? lead?.project[0] : lead?.project

  return (
    <tr className="border-b border-border hover:bg-surface-2/50 transition-colors">
      <td className="px-4 py-3">
        <div className="text-[13px] font-medium text-content">{lead?.full_name ?? '—'}</div>
        <div className="text-[11.5px] text-content-3">{project?.name ?? '—'}</div>
      </td>
      <td className="px-4 py-3">
        <div className="text-[13px] text-content">{realtor?.full_name ?? '—'}</div>
        <div className="text-[11.5px] text-content-3">{realtor?.email ?? ''}</div>
      </td>
      <td className="px-4 py-3 text-[13px] text-content">{formatCurrency(c.deal_value)}</td>
      <td className="px-4 py-3 text-[13px] text-content">
        {c.commission_rate ? `${c.commission_rate}%` : '—'}
      </td>
      <td className="px-4 py-3 text-[13px] font-medium text-content">{formatCurrency(c.commission_amount)}</td>
      <td className="px-4 py-3"><CommissionStatusBadge status={c.status} /></td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {c.status === 'pending' && (
            <form action={approveCommission.bind(null, c.lead_id)}>
              <SubmitButton
                label="Approve"
                loadingLabel="Approving…"
                className="rounded-[6px] bg-brand px-2.5 py-1 text-[12px] font-medium text-white hover:bg-brand/90 disabled:opacity-60 inline-flex items-center gap-1.5 transition-opacity"
              />
            </form>
          )}
          {c.status === 'approved' && (
            <form action={markCommissionPaid.bind(null, c.lead_id)}>
              <SubmitButton
                label="Mark Paid"
                loadingLabel="Saving…"
                className="rounded-[6px] bg-green-600 px-2.5 py-1 text-[12px] font-medium text-white hover:bg-green-700 disabled:opacity-60 inline-flex items-center gap-1.5 transition-opacity"
              />
            </form>
          )}
          {c.status === 'paid' && (
            <span className="text-[12px] text-content-3">
              {c.paid_at ? new Date(c.paid_at).toLocaleDateString('en-SA') : 'Paid'}
            </span>
          )}
        </div>
      </td>
    </tr>
  )
}

// ── Data-fetching component (streams in) ─────────────────────────────────────
async function CommissionsContent() {
  const supabase = await createClient()

  const { data: commissions } = await supabase
    .from('commission_records')
    .select('*, lead:leads(id, full_name, project:projects(name, slug)), realtor:profiles!commission_records_realtor_id_fkey(full_name, email)')
    .order('created_at', { ascending: false })

  const pending = (commissions ?? []).filter((c: any) => c.status === 'pending')
  const approved = (commissions ?? []).filter((c: any) => c.status === 'approved')
  const paid = (commissions ?? []).filter((c: any) => c.status === 'paid')

  const totalPending = pending.reduce((sum: number, c: any) => sum + (c.commission_amount ?? 0), 0)
  const totalApproved = approved.reduce((sum: number, c: any) => sum + (c.commission_amount ?? 0), 0)
  const totalPaid = paid.reduce((sum: number, c: any) => sum + (c.commission_amount ?? 0), 0)

  return (
    <>
      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-[10px] border border-border bg-white p-4">
          <div className="mb-1 text-[12px] font-medium text-content-3 uppercase tracking-[0.04em]">Pending</div>
          <div className="text-[22px] font-semibold tracking-[-0.02em] text-amber-600">{formatCurrency(totalPending)}</div>
          <div className="mt-0.5 text-[12px] text-content-3">{pending.length} commission{pending.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="rounded-[10px] border border-border bg-white p-4">
          <div className="mb-1 text-[12px] font-medium text-content-3 uppercase tracking-[0.04em]">Approved</div>
          <div className="text-[22px] font-semibold tracking-[-0.02em] text-blue-600">{formatCurrency(totalApproved)}</div>
          <div className="mt-0.5 text-[12px] text-content-3">{approved.length} commission{approved.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="rounded-[10px] border border-border bg-white p-4">
          <div className="mb-1 text-[12px] font-medium text-content-3 uppercase tracking-[0.04em]">Paid</div>
          <div className="text-[22px] font-semibold tracking-[-0.02em] text-green-600">{formatCurrency(totalPaid)}</div>
          <div className="mt-0.5 text-[12px] text-content-3">{paid.length} commission{paid.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[10px] border border-border bg-white">
        {(commissions ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-2 text-[32px]">💰</div>
            <div className="text-[14px] font-medium text-content">No commission records yet</div>
            <div className="mt-1 text-[13px] text-content-3">Commission records appear when external realtors submit leads that convert</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-surface-2/50">
                <th className="px-4 py-2.5 text-left text-[11.5px] font-medium text-content-3">Lead / Project</th>
                <th className="px-4 py-2.5 text-left text-[11.5px] font-medium text-content-3">Realtor</th>
                <th className="px-4 py-2.5 text-left text-[11.5px] font-medium text-content-3">Deal Value</th>
                <th className="px-4 py-2.5 text-left text-[11.5px] font-medium text-content-3">Rate</th>
                <th className="px-4 py-2.5 text-left text-[11.5px] font-medium text-content-3">Commission</th>
                <th className="px-4 py-2.5 text-left text-[11.5px] font-medium text-content-3">Status</th>
                <th className="px-4 py-2.5 text-left text-[11.5px] font-medium text-content-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {(commissions ?? []).map((c: any) => (
                <CommissionRow key={c.id} c={c} />
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </>
  )
}

// ── Skeleton fallback ────────────────────────────────────────────────────────
function CommissionsSkeleton() {
  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-[10px] border border-border bg-white p-4">
            <div className="mb-2 h-3 w-16 animate-pulse rounded-full bg-[#F3F4F6]" />
            <div className="mb-1.5 h-7 w-28 animate-pulse rounded-md bg-[#E5E7EB]" />
            <div className="h-3 w-20 animate-pulse rounded-full bg-[#F9FAFB]" />
          </div>
        ))}
      </div>
      <div className="rounded-[10px] border border-border bg-white overflow-hidden">
        <div className="border-b border-border bg-surface-2/50 px-4 py-2.5">
          <div className="grid grid-cols-7 gap-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-3 animate-pulse rounded-full bg-[#E5E7EB]" />
            ))}
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-3.5">
            <div className="flex-1">
              <div className="mb-1.5 h-3.5 w-32 animate-pulse rounded-full bg-[#F3F4F6]" />
              <div className="h-3 w-20 animate-pulse rounded-full bg-[#F9FAFB]" />
            </div>
            <div className="flex-1">
              <div className="mb-1.5 h-3.5 w-24 animate-pulse rounded-full bg-[#F3F4F6]" />
              <div className="h-3 w-32 animate-pulse rounded-full bg-[#F9FAFB]" />
            </div>
            <div className="h-3.5 w-20 animate-pulse rounded-full bg-[#F3F4F6]" />
            <div className="h-3.5 w-12 animate-pulse rounded-full bg-[#F3F4F6]" />
            <div className="h-3.5 w-20 animate-pulse rounded-full bg-[#F3F4F6]" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-[#F3F4F6]" />
            <div className="h-6 w-16 animate-pulse rounded-[6px] bg-[#E5E7EB]" />
          </div>
        ))}
      </div>
    </>
  )
}
