import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { createProject } from '@/lib/actions/projects'
import { SubmitButton } from '@/components/shared/SubmitButton'
import Link from 'next/link'
import { X } from 'lucide-react'

export default async function NewProjectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'head') redirect('/projects')

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar
        crumbs={['Workspace', 'Projects', 'New project']}
        action={
          <Link href="/projects" className="inline-flex items-center gap-1 rounded-[6px] border border-border bg-white px-2.5 py-[5px] text-[13px] font-medium text-content hover:bg-surface-2">
            <X size={13} /> Cancel
          </Link>
        }
      />
      <div className="flex-1 overflow-auto p-4 sm:p-7">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-6 text-[20px] font-semibold tracking-[-0.02em]">New project</h1>

          <form action={createProject} className="space-y-5">
            {/* Basic info */}
            <section className="rounded-[10px] border border-border bg-white p-5">
              <h2 className="mb-4 text-[13px] font-semibold">Basic information</h2>
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-content-2">Project name *</label>
                    <input name="name" required placeholder="e.g. Skyline Heights"
                      className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-content-2">Status</label>
                    <select name="status"
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
                  <textarea name="description" rows={3} placeholder="Brief description of the project…"
                    className="w-full resize-none rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                </div>
              </div>
            </section>

            {/* Location */}
            <section className="rounded-[10px] border border-border bg-white p-5">
              <h2 className="mb-4 text-[13px] font-semibold">Location</h2>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-content-2">City</label>
                  <input name="city" placeholder="e.g. Mumbai"
                    className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-content-2">Full location</label>
                  <input name="location" placeholder="e.g. Bandra West, Mumbai"
                    className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                </div>
              </div>
            </section>

            {/* Pricing & units */}
            <section className="rounded-[10px] border border-border bg-white p-5">
              <h2 className="mb-4 text-[13px] font-semibold">Pricing & units</h2>
              <div className="grid grid-cols-3 gap-3.5">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-content-2">Price from</label>
                  <input name="pricing_min" placeholder="e.g. 500K"
                    className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-content-2">Price to</label>
                  <input name="pricing_max" placeholder="e.g. 2M"
                    className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-content-2">Total units</label>
                  <input name="total_units" type="number" min="0" placeholder="e.g. 240"
                    className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                </div>
              </div>
            </section>

            {/* RERA & amenities */}
            <section className="rounded-[10px] border border-border bg-white p-5">
              <h2 className="mb-4 text-[13px] font-semibold">Details</h2>
              <div className="space-y-3.5">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-content-2">RERA number</label>
                  <input name="rera_number" placeholder="e.g. P51800027594"
                    className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-content-2">Amenities</label>
                  <input name="amenities" placeholder="Swimming Pool, Gym, Clubhouse, Children's Play Area"
                    className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                  <p className="mt-1 text-[11.5px] text-content-3">Separate with commas</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="is_published" value="true"
                    className="rounded border-border" />
                  <span className="text-[13px] text-content">Publish to external portal</span>
                </label>
              </div>
            </section>

            <div className="flex items-center justify-end gap-2">
              <Link href="/projects" className="rounded-[7px] border border-border bg-white px-4 py-2 text-[13px] font-medium text-content hover:bg-surface-2">
                Cancel
              </Link>
              <SubmitButton label="Create project" loadingLabel="Creating…" />
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
