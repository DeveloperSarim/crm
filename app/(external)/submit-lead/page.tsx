import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { submitExternalLead } from '@/lib/actions/external'
import { StandaloneSubmitLeadForm } from '@/components/portal/StandaloneSubmitLeadForm'

export default async function StandaloneSubmitLeadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/partner/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, slug')
    .eq('is_published', true)
    .neq('status', 'archived')
    .order('name', { ascending: true })

  return (
    <div className="mx-auto max-w-[720px] px-4 sm:px-6 py-8">
      {/* Back link */}
      <Link
        href="/portal"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-[#6B7280] hover:text-[#111827]"
      >
        <ArrowLeft size={14} />
        Back to projects
      </Link>

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#111827] sm:text-[26px]">
          Submit a lead
        </h1>
        <p className="mt-1.5 max-w-[520px] text-[13.5px] text-[#6B7280]">
          Submissions are reviewed within 4 hours. Once accepted, the lead is locked to your channel for 30 days.
        </p>
      </div>

      <StandaloneSubmitLeadForm
        projects={(projects ?? []) as { id: string; name: string; slug: string }[]}
        action={submitExternalLead}
      />
    </div>
  )
}
