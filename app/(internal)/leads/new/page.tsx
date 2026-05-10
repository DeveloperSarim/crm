import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Topbar } from '@/components/layout/Topbar'
import { createLead } from '@/lib/actions/leads'
import { SubmitButton } from '@/components/shared/SubmitButton'
import Link from 'next/link'
import { X } from 'lucide-react'

const PROPERTY_TYPES = [
  { id: 'apartment', label: 'Apartment', glyph: '▤' },
  { id: 'villa', label: 'Villa', glyph: '◮' },
  { id: 'building', label: 'Building', glyph: '▦' },
  { id: 'land', label: 'Land / Plot', glyph: '▱' },
  { id: 'office', label: 'Office', glyph: '◫' },
  { id: 'commercial', label: 'Commercial', glyph: '◧' },
  { id: 'retail', label: 'Retail', glyph: '◨' },
  { id: 'warehouse', label: 'Warehouse', glyph: '▭' },
]

export default async function GlobalNewLeadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: projects },
    { data: sources },
    { data: profile },
  ] = await Promise.all([
    supabase.from('projects').select('id, name, slug').neq('status', 'archived').order('name'),
    supabase.from('lead_sources').select('id, name').eq('is_active', true).order('name'),
    supabase.from('profiles').select('role').eq('id', user.id).single(),
  ])

  const isHead = (profile as any)?.role === 'head'

  const { data: teamMembers } = isHead
    ? await supabase.from('profiles').select('id, full_name').eq('role', 'sales_member').eq('is_active', true).order('full_name')
    : { data: [] }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar
        crumbs={['Workspace', 'Leads', 'New lead']}
        action={
          <Link href="/leads" className="inline-flex items-center gap-1 rounded-[6px] border border-border bg-white px-2.5 py-[5px] text-[13px] font-medium text-content hover:bg-surface-2">
            <X size={13} /> Cancel
          </Link>
        }
      />
      <div className="flex-1 overflow-auto p-4 sm:p-7">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-6 text-[20px] font-semibold tracking-[-0.02em]">Add lead</h1>

          <form action={createLead} className="space-y-5">
            <input type="hidden" name="project_slug" value="" />

            <section className="rounded-[10px] border border-border bg-white p-5">
              <h2 className="mb-4 text-[13px] font-semibold">Project</h2>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-content-2">Select project *</label>
                <select name="project_id" required
                  className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50">
                  <option value="">Choose a project…</option>
                  {(projects ?? []).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </section>

            <section className="rounded-[10px] border border-border bg-white p-5">
              <h2 className="mb-4 text-[13px] font-semibold">Contact details</h2>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-content-2">Full name *</label>
                  <input name="full_name" required placeholder="e.g. Priya Raghavan"
                    className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-content-2">Phone *</label>
                  <input name="phone" required type="tel" placeholder="+91 98200 00000"
                    className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-content-2">Email</label>
                  <input name="email" type="email" placeholder="priya@example.com"
                    className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-content-2">Address / City</label>
                  <input name="address" placeholder="Current location"
                    className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                </div>
              </div>
            </section>

            <section className="rounded-[10px] border border-border bg-white p-5">
              <h2 className="mb-4 text-[13px] font-semibold">Requirements</h2>
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-content-2">Intent</label>
                    <select name="intent"
                      className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50">
                      <option value="">Select…</option>
                      <option value="buy">Buy</option>
                      <option value="rent">Rent</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-content-2">Budget</label>
                    <input name="budget_display" placeholder="e.g. SAR 350K or SAR 85K/mo"
                      className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-content-2">Property type</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PROPERTY_TYPES.map(t => (
                      <label key={t.id} className="cursor-pointer">
                        <input type="radio" name="property_type" value={t.id} className="sr-only peer" />
                        <span className="inline-flex items-center gap-1.5 rounded-[6px] border border-border bg-white px-2.5 py-1.5 text-[12.5px] transition-all peer-checked:border-[#111827] peer-checked:bg-[#111827] peer-checked:text-white hover:bg-surface-2">
                          <span className="font-mono opacity-65">{t.glyph}</span>
                          {t.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-content-2">Query / Requirements</label>
                  <textarea name="query" rows={3} placeholder="What is the lead looking for?"
                    className="w-full resize-none rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-content-2">Follow-up date</label>
                    <input name="follow_up_date" type="date"
                      className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-content-2">Follow-up notes</label>
                    <input name="follow_up_notes" placeholder="Reminder note…"
                      className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[10px] border border-border bg-white p-5">
              <h2 className="mb-4 text-[13px] font-semibold">Source & assignment</h2>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-content-2">Lead source</label>
                  <select name="lead_source_id"
                    className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50">
                    <option value="">Select source…</option>
                    {(sources ?? []).map(s => (
                      <option key={(s as any).id} value={(s as any).id}>{(s as any).name}</option>
                    ))}
                  </select>
                </div>
                {isHead && (
                  <div>
                    <label className="mb-1 block text-[12px] font-medium text-content-2">Assign to</label>
                    <select name="assigned_to"
                      className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50">
                      <option value="">Unassigned</option>
                      {(teamMembers ?? []).map(m => (
                        <option key={(m as any).id} value={(m as any).id}>{(m as any).full_name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </section>

            <div className="flex items-center justify-end gap-2">
              <Link href="/leads" className="rounded-[7px] border border-border bg-white px-4 py-2 text-[13px] font-medium text-content hover:bg-surface-2">
                Cancel
              </Link>
              <SubmitButton label="Add lead" loadingLabel="Adding lead…" />
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
