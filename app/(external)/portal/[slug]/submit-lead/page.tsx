import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { submitExternalLead } from '@/lib/actions/external'
import { SubmitLeadForm } from '@/components/portal/SubmitLeadForm'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ error?: string }>
}

export default async function SubmitLeadPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { error } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/partner/login')

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, slug, property_types')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!project) notFound()

  const allowedPropertyTypes = Array.isArray((project as any).property_types)
    ? ((project as any).property_types as string[])
    : []

  return (
    <div className="mx-auto max-w-[720px] px-4 sm:px-6 py-7">
      {/* Back link */}
      <Link
        href={`/portal/${slug}`}
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-[#6B7280] hover:text-[#111827]"
      >
        <ArrowLeft size={14} />
        Back to {project.name}
      </Link>

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-[20px] font-bold tracking-[-0.02em] text-[#111827] sm:text-[22px]">
          Submit a lead
        </h1>
        <p className="mt-1 text-[13px] text-[#6B7280]">
          For{' '}
          <span className="font-medium text-[#111827]">{project.name}</span>
        </p>
      </div>

      <SubmitLeadForm
        projectId={project.id}
        projectSlug={slug}
        projectName={project.name}
        allowedPropertyTypes={allowedPropertyTypes}
        showError={error === '1'}
        action={submitExternalLead}
      />
    </div>
  )
}
