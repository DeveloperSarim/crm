import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StatusBadge } from '@/components/shared/StatusBadge'
import Link from 'next/link'
import { MapPin, Building2 } from 'lucide-react'

export default async function PortalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/partner/login')

  const [{ data: projects }, { count: submissionsThisMonth }, { count: closedWon }] =
    await Promise.all([
      supabase
        .from('projects')
        .select('*')
        .not('status', 'in', '("archived","draft")')
        .order('created_at', { ascending: false }),
      supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('external_realtor_id', user.id)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('external_realtor_id', user.id)
        .eq('status', 'won'),
    ])

  return (
    <div className="mx-auto max-w-[1100px] px-4 sm:px-6 py-8">

      {/* Page header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="mb-1 text-[12.5px] text-[#6B7280]">Inventory available to your channel</div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#111827] sm:text-[26px]">
            Open projects
          </h1>
        </div>
        <Link
          href="/submit-lead"
          className="hidden items-center gap-1.5 rounded-[7px] bg-[#2563EB] px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#1D4ED8] sm:flex"
        >
          + Submit a lead
        </Link>
      </div>

      {/* Commission info bar */}
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[10px] border border-[#E5E7EB] bg-white px-4 py-3 text-[13px]">
        <span className="flex items-center gap-1.5 text-[#6B7280]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#10B981]" />
          Channel commission active
        </span>
        <span className="text-[#D1D5DB]">·</span>
        <span className="text-[#6B7280]">
          Submissions this month:{' '}
          <span className="font-medium text-[#111827]">{submissionsThisMonth ?? 0}</span>
        </span>
        <span className="text-[#D1D5DB]">·</span>
        <span className="text-[#6B7280]">
          Closed Won:{' '}
          <span className="font-medium text-[#111827]">{closedWon ?? 0}</span>
        </span>
        <div className="flex-1" />
        <a href="#" className="text-[12.5px] text-[#2563EB] hover:underline">
          View commission terms →
        </a>
      </div>

      {(!projects || projects.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Building2 size={24} className="mb-3 text-[#9CA3AF]" />
          <div className="text-[14px] font-medium text-[#111827]">No projects available</div>
          <div className="mt-1 text-[13px] text-[#6B7280]">Check back later</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => {
            const hue = project.color_hue ?? 210
            const pricing = Array.isArray(project.pricing_details) ? project.pricing_details as any[] : []
            return (
              <div
                key={project.id}
                className="group overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white transition-shadow hover:shadow-[0_4px_16px_rgba(17,24,39,0.07)]"
              >
                {/* Cover image */}
                <div className="relative h-[160px] overflow-hidden">
                  {project.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={project.cover_image_url}
                      alt={project.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center text-[32px] text-[#818CF8]"
                      style={{
                        background: `linear-gradient(135deg, oklch(0.92 0.04 ${hue}) 0%, oklch(0.90 0.06 ${hue + 30}) 100%)`,
                      }}
                    >
                      ▦
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="p-4">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <span className="text-[14.5px] font-semibold leading-snug text-[#111827]">{project.name}</span>
                    <StatusBadge kind={project.status} />
                  </div>

                  <div className="mb-4 flex items-center gap-1 text-[12.5px] text-[#6B7280]">
                    {project.city && (
                      <>
                        <MapPin size={11} className="text-[#9CA3AF]" />
                        <span>{project.city}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      {pricing[0]?.price && (
                        <>
                          <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#9CA3AF]">Price</div>
                          <div className="mt-0.5 text-[13.5px] font-medium text-[#111827]">{(pricing[0].price as string).replace(/₹\s*/g, 'SAR ').trim()}</div>
                        </>
                      )}
                    </div>
                    <Link
                      href={`/portal/${project.slug}/submit-lead`}
                      className="rounded-[6px] border border-[#E5E7EB] px-3 py-1.5 text-[12px] font-medium text-[#374151] transition-colors hover:border-[#D1D5DB] hover:bg-[#F9FAFB]"
                    >
                      Submit lead →
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
