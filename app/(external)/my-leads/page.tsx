import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { MyLeadsClient } from '@/components/portal/MyLeadsClient'

interface PageProps {
  searchParams: Promise<{ submitted?: string }>
}

export default async function MyLeadsPage({ searchParams }: PageProps) {
  const { submitted } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/partner/login')

  const { data: leads } = await supabase
    .from('leads')
    .select(`
      id, reference_id, full_name, phone, email, status, commission_status,
      budget_display, intent, property_type, created_at,
      project:projects(name, slug)
    `)
    .eq('external_realtor_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-[1180px] px-4 sm:px-6 py-8">
      {/* Success banner after submission */}
      {submitted && (
        <div className="mb-5 flex items-center gap-2.5 rounded-[8px] border border-[#A7F3D0] bg-[#ECFDF5] px-4 py-3 text-[13px] text-[#047857]">
          <CheckCircle size={15} className="flex-none" />
          Lead submitted successfully. We&apos;ll be in touch soon.
        </div>
      )}

      {/* Page header */}
      <div className="mb-5 flex items-end justify-between">
        <div>
          <div className="mb-1 text-[12.5px] text-[#6B7280]">Submissions from your channel</div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#111827] sm:text-[26px]">
            My leads
          </h1>
        </div>
        <Link
          href="/submit-lead"
          className="hidden items-center gap-1.5 rounded-[7px] bg-[#2563EB] px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#1D4ED8] sm:flex"
        >
          + New submission
        </Link>
      </div>

      <MyLeadsClient leads={(leads ?? []) as any} />
    </div>
  )
}
