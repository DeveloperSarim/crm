import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { StatusBadge } from '@/components/shared/StatusBadge'
import Link from 'next/link'
import { MapPin, Building2, Tag, Plus, ShieldCheck, Calendar, Phone } from 'lucide-react'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function PortalProjectPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/partner/login')

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', slug)
    .not('status', 'in', '("archived","draft")')
    .single()

  if (!project) notFound()

  const hue = project.color_hue ?? 210
  const pricing = Array.isArray(project.pricing_details) ? project.pricing_details as any[] : []
  const amenities = Array.isArray(project.amenities) ? project.amenities as string[] : []
  const highlights = Array.isArray(project.highlights) ? project.highlights as string[] : []

  // Sanitise legacy ₹ values stored in the DB before SAR migration
  function sanitisePrice(val: string | undefined): string | undefined {
    if (!val) return val
    return val.replace(/₹\s*/g, 'SAR ').replace(/\s+/g, ' ').trim()
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8">

      {/* Hero card */}
      <div className="mb-4 overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white">
        {/* Cover */}
        <div className="relative h-[190px] sm:h-[240px]">
          {project.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.cover_image_url} alt={project.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[40px]" style={{
              background: `linear-gradient(135deg, oklch(0.93 0.03 ${hue}) 0%, oklch(0.90 0.06 ${hue + 30}) 100%)`,
            }}>▦</div>
          )}
        </div>

        {/* Title row */}
        <div className="p-4 sm:p-5">
          <div className="mb-2 flex flex-wrap items-start gap-2">
            <h1 className="flex-1 text-[20px] font-semibold tracking-[-0.02em] text-[#111827] sm:text-[22px]">
              {project.name}
            </h1>
            <StatusBadge kind={project.status} />
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-3 text-[13px] text-[#6B7280]">
            {(project.location || project.city) && (
              <span className="flex items-center gap-1.5">
                <MapPin size={12} className="text-[#9CA3AF]" />
                {[project.location, project.city].filter(Boolean).join(', ')}
              </span>
            )}
            {project.total_units && (
              <span className="flex items-center gap-1.5">
                <Building2 size={12} className="text-[#9CA3AF]" />
                {project.total_units} units
              </span>
            )}
            {project.handover_date && (
              <span className="flex items-center gap-1.5">
                <Calendar size={12} className="text-[#9CA3AF]" />
                Handover {new Date(project.handover_date).toLocaleDateString('en-SA', { month: 'short', year: 'numeric' })}
              </span>
            )}
            {project.rera_number && (
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-[#9CA3AF]" />
                RERA {project.rera_number}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pricing table */}
      {pricing.length > 0 && (
        <div className="mb-4 overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white">
          <div className="flex items-center justify-between border-b border-[#EEF0F3] px-4 py-3 sm:px-5">
            <h2 className="text-[13px] font-semibold text-[#111827]">Pricing</h2>
            <span className="text-[12px] text-[#9CA3AF]">Channel commission 1.25%</span>
          </div>
          <div className="divide-y divide-[#EEF0F3]">
            {pricing.map((tier: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 sm:px-5">
                <div>
                  {tier.unit_type && (
                    <div className="text-[13px] font-medium text-[#111827]">{tier.unit_type}</div>
                  )}
                  {tier.size && (
                    <div className="mt-0.5 text-[12px] text-[#9CA3AF]">{tier.size}</div>
                  )}
                </div>
                <div className="text-right">
                  {tier.price && (
                    <div className="text-[13.5px] font-semibold text-[#111827]">{sanitisePrice(tier.price)}</div>
                  )}
                  {tier.price_per_sqft && (
                    <div className="mt-0.5 text-[11.5px] text-[#9CA3AF]">{sanitisePrice(tier.price_per_sqft)}/sq ft</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {project.description && (
        <div className="mb-4 rounded-[12px] border border-[#E5E7EB] bg-white px-4 py-4 sm:px-5">
          <h2 className="mb-2 text-[13px] font-semibold text-[#111827]">About this project</h2>
          <p className="text-[13.5px] leading-[1.7] text-[#6B7280]">{project.description}</p>
        </div>
      )}

      {/* Highlights */}
      {highlights.length > 0 && (
        <div className="mb-4 rounded-[12px] border border-[#E5E7EB] bg-white px-4 py-4 sm:px-5">
          <h2 className="mb-3 text-[13px] font-semibold text-[#111827]">Highlights</h2>
          <ul className="space-y-2">
            {highlights.map((h: string, i: number) => (
              <li key={i} className="flex items-start gap-2.5 text-[13px] text-[#6B7280]">
                <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-[#10B981]" />
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Amenities */}
      {amenities.length > 0 && (
        <div className="mb-4 rounded-[12px] border border-[#E5E7EB] bg-white px-4 py-4 sm:px-5">
          <h2 className="mb-3 text-[13px] font-semibold text-[#111827]">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {amenities.map((a: string) => (
              <span key={a} className="rounded-[6px] border border-[#E5E7EB] bg-[#FAFAFB] px-2.5 py-1 text-[12.5px] text-[#6B7280]">
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Details grid — developer, total units, property types etc */}
      {(project.developer_name || project.property_type || project.area_sqft) && (
        <div className="mb-4 rounded-[12px] border border-[#E5E7EB] bg-white px-4 py-4 sm:px-5">
          <h2 className="mb-3 text-[13px] font-semibold text-[#111827]">Project details</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px] sm:grid-cols-3">
            {project.developer_name && (
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#9CA3AF]">Developer</dt>
                <dd className="mt-0.5 font-medium text-[#111827]">{project.developer_name}</dd>
              </div>
            )}
            {project.property_type && (
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#9CA3AF]">Type</dt>
                <dd className="mt-0.5 font-medium capitalize text-[#111827]">{project.property_type}</dd>
              </div>
            )}
            {project.total_units && (
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#9CA3AF]">Total units</dt>
                <dd className="mt-0.5 font-medium text-[#111827]">{project.total_units}</dd>
              </div>
            )}
            {project.area_sqft && (
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#9CA3AF]">Area</dt>
                <dd className="mt-0.5 font-medium text-[#111827]">{project.area_sqft.toLocaleString()} sq ft</dd>
              </div>
            )}
            {project.floors && (
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#9CA3AF]">Floors</dt>
                <dd className="mt-0.5 font-medium text-[#111827]">{project.floors}</dd>
              </div>
            )}
            {project.rera_number && (
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#9CA3AF]">RERA No.</dt>
                <dd className="mt-0.5 font-mono text-[12px] text-[#111827]">{project.rera_number}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {/* Contact / submit CTA */}
      <div className="rounded-[12px] border border-[#2563EB]/20 bg-[#EFF6FF] px-4 py-4 sm:px-5">
        <div className="mb-1 flex items-center gap-2">
          <Tag size={14} className="text-[#2563EB]" />
          <h2 className="text-[14px] font-semibold text-[#111827]">Have a client for this project?</h2>
        </div>
        <p className="mb-4 text-[13px] text-[#4B5563]">
          Submit their details and earn <span className="font-medium text-[#111827]">1.25% commission</span> on close.
          Your channel lock: 30 days from submission.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/portal/${slug}/submit-lead`}
            className="inline-flex items-center gap-1.5 rounded-[7px] bg-[#2563EB] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#1D4ED8]"
          >
            <Plus size={14} /> Submit a lead
          </Link>
          {project.contact_phone && (
            <a
              href={`tel:${project.contact_phone}`}
              className="inline-flex items-center gap-1.5 rounded-[7px] border border-[#2563EB]/30 bg-white px-4 py-2 text-[13px] font-medium text-[#2563EB] hover:bg-white/80"
            >
              <Phone size={13} /> Call project team
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
