import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { updateProject } from '@/lib/actions/projects'
import { ProjectCoverUpload } from '@/components/projects/ProjectCoverUpload'
import { SubmitButton } from '@/components/shared/SubmitButton'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function ProjectSettingsPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'head') redirect(`/projects/${slug}`)

  const { data: project } = await supabase.from('projects').select('*').eq('slug', slug).single()
  if (!project) notFound()

  const amenities = Array.isArray(project.amenities) ? (project.amenities as string[]).join(', ') : ''
  const pricing = Array.isArray(project.pricing_details) ? (project.pricing_details as any[]) : []
  const savedPropertyTypes = Array.isArray(project.property_types) ? (project.property_types as string[]) : []

  const ALL_PROPERTY_TYPES = [
    { id: 'apartment', label: 'Apartment', glyph: '▤' },
    { id: 'villa',     label: 'Villa',     glyph: '◮' },
    { id: 'building',  label: 'Building',  glyph: '▦' },
    { id: 'land',      label: 'Land / Plot', glyph: '▱' },
    { id: 'office',    label: 'Office',    glyph: '◫' },
    { id: 'commercial',label: 'Commercial',glyph: '◧' },
    { id: 'retail',    label: 'Retail',    glyph: '◨' },
    { id: 'warehouse', label: 'Warehouse', glyph: '▭' },
  ]

  const updateWithSlug = updateProject.bind(null, slug)

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar
        crumbs={['Workspace', 'Projects', project.name, 'Settings']}
        action={
          <Link href={`/projects/${slug}`} className="inline-flex items-center gap-1 rounded-[6px] border border-border bg-white px-2.5 py-[5px] text-[13px] font-medium text-content hover:bg-surface-2">
            <ArrowLeft size={13} /> Back
          </Link>
        }
      />
      <div className="flex-1 overflow-auto p-4 sm:p-7">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-6 text-[20px] font-semibold tracking-[-0.02em]">Project settings</h1>

          {/* Cover image — standalone, outside main form */}
          <div className="mb-5 rounded-[10px] border border-border bg-white p-5">
            <h2 className="mb-4 text-[13px] font-semibold">Cover image</h2>
            <ProjectCoverUpload
              projectSlug={slug}
              projectId={project.id}
              currentCoverUrl={project.cover_image_url ?? null}
            />
          </div>

          <form action={updateWithSlug} className="space-y-5">
            <section className="rounded-[10px] border border-border bg-white p-5">
              <h2 className="mb-4 text-[13px] font-semibold">Basic information</h2>
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-content-2">Project name *</label>
                    <input name="name" required defaultValue={project.name}
                      className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-content-2">Status</label>
                    <select name="status" defaultValue={project.status}
                      className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50">
                      <option value="active">Active</option>
                      <option value="presale">Pre-sale</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-content-2">Description</label>
                  <textarea name="description" rows={3} defaultValue={project.description ?? ''}
                    className="w-full resize-none rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                </div>
              </div>
            </section>

            <section className="rounded-[10px] border border-border bg-white p-5">
              <h2 className="mb-4 text-[13px] font-semibold">Location</h2>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-content-2">City</label>
                  <input name="city" defaultValue={project.city ?? ''}
                    className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-content-2">Full location</label>
                  <input name="location" defaultValue={project.location ?? ''}
                    className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                </div>
              </div>
            </section>

            <section className="rounded-[10px] border border-border bg-white p-5">
              <h2 className="mb-4 text-[13px] font-semibold">Pricing & units</h2>
              <div className="grid grid-cols-3 gap-3.5">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-content-2">Price from</label>
                  <input name="pricing_min" defaultValue={pricing[0]?.price ?? ''}
                    placeholder="e.g. 500K"
                    className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-content-2">Price to</label>
                  <input name="pricing_max" placeholder="e.g. 2M"
                    className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-content-2">Total units</label>
                  <input name="total_units" type="number" min="0" defaultValue={project.total_units ?? ''}
                    className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                </div>
              </div>
            </section>

            <section className="rounded-[10px] border border-border bg-white p-5">
              <h2 className="mb-4 text-[13px] font-semibold">Details</h2>
              <div className="space-y-3.5">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-content-2">RERA number</label>
                  <input name="rera_number" defaultValue={project.rera_number ?? ''}
                    className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-content-2">Amenities</label>
                  <input name="amenities" defaultValue={amenities}
                    placeholder="Swimming Pool, Gym, Clubhouse"
                    className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                  <p className="mt-1 text-[11.5px] text-content-3">Separate with commas</p>
                </div>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" name="is_published" value="true"
                    defaultChecked={project.is_published}
                    className="rounded border-border" />
                  <span className="text-[13px] text-content">Published to external portal</span>
                </label>
              </div>
            </section>

            <section className="rounded-[10px] border border-border bg-white p-5">
              <h2 className="mb-1 text-[13px] font-semibold">Available property types</h2>
              <p className="mb-4 text-[12px] text-content-3">
                Tick the types that exist in this project. Partner realtors on the external portal
                will only be able to select these types when submitting a lead.
                If none are ticked, all types are shown.
              </p>
              <div className="flex flex-wrap gap-2">
                {ALL_PROPERTY_TYPES.map(t => (
                  <label
                    key={t.id}
                    className="flex cursor-pointer items-center gap-2 rounded-[8px] border border-border px-3 py-2 hover:bg-surface-2 has-[:checked]:border-[#111827] has-[:checked]:bg-[#F8F9FA]"
                  >
                    <input
                      type="checkbox"
                      name="property_types"
                      value={t.id}
                      defaultChecked={savedPropertyTypes.includes(t.id)}
                      className="rounded border-border accent-[#111827]"
                    />
                    <span className="font-mono text-[13px] opacity-60">{t.glyph}</span>
                    <span className="text-[13px] font-medium text-content">{t.label}</span>
                  </label>
                ))}
              </div>
            </section>

            <div className="flex items-center justify-end gap-2">
              <Link href={`/projects/${slug}`} className="rounded-[7px] border border-border bg-white px-4 py-2 text-[13px] font-medium text-content hover:bg-surface-2">
                Cancel
              </Link>
              <SubmitButton label="Save changes" loadingLabel="Saving…" />
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
