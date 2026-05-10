'use client'

import { useState } from 'react'
import Link from 'next/link'

const PROPERTY_TYPES = [
  { id: 'apartment', label: 'Apartment', glyph: '▤' },
  { id: 'villa',     label: 'Villa',     glyph: '◮' },
  { id: 'building',  label: 'Building',  glyph: '▦' },
  { id: 'land',      label: 'Land / Plot', glyph: '▱' },
  { id: 'office',    label: 'Office',    glyph: '◫' },
  { id: 'commercial', label: 'Commercial', glyph: '◧' },
  { id: 'retail',    label: 'Retail',    glyph: '◨' },
  { id: 'warehouse', label: 'Warehouse', glyph: '▭' },
  { id: 'other',     label: 'Other',     glyph: '·' },
]

const TIMELINES = ['0-3 months', '3-6 months', '6-12 months', 'Just exploring']

interface FormRowProps {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}

function FormRow({ label, required, hint, children }: FormRowProps) {
  return (
    <div className="grid grid-cols-1 gap-2 border-b border-[#EEF0F3] py-4 last:border-0 sm:grid-cols-[180px_1fr] sm:gap-0">
      <label className="text-[13px] font-medium text-[#374151] sm:pt-[7px]">
        {label}
        {required && <span className="ml-0.5 text-[#EF4444]">*</span>}
      </label>
      <div>
        {children}
        {hint && <p className="mt-1 text-[11.5px] text-[#9CA3AF]">{hint}</p>}
      </div>
    </div>
  )
}

const inputCls = 'w-full rounded-[7px] border border-[#E5E7EB] px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]/50 focus:ring-1 focus:ring-[#2563EB]/20'
const selectCls = inputCls + ' appearance-none bg-white cursor-pointer'

interface Props {
  projects: { id: string; name: string; slug: string }[]
  action: (formData: FormData) => Promise<void>
}

export function StandaloneSubmitLeadForm({ projects, action }: Props) {
  const [intent, setIntent] = useState<'buy' | 'rent'>('buy')
  const [propType, setPropType] = useState<string | null>(null)
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [projectSlug, setProjectSlug] = useState(projects[0]?.slug ?? '')

  function handleProjectChange(id: string) {
    setProjectId(id)
    const p = projects.find(p => p.id === id)
    setProjectSlug(p?.slug ?? '')
  }

  return (
    <form action={action}>
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="project_slug" value={projectSlug} />
      <input type="hidden" name="intent" value={intent} />
      <input type="hidden" name="property_type" value={propType ?? ''} />

      {/* ── Client details ─────────────────────── */}
      <div className="mb-4 rounded-[12px] border border-[#E5E7EB] bg-white px-5">
        <h2 className="border-b border-[#EEF0F3] py-4 text-[13px] font-semibold text-[#111827]">
          Client
          <span className="ml-1.5 font-normal text-[#9CA3AF]">— who&apos;s the buyer?</span>
        </h2>

        <FormRow label="Full name" required>
          <input name="full_name" required placeholder="Priya Raghavan" className={inputCls} />
        </FormRow>

        <div className="grid grid-cols-1 gap-0 border-b border-[#EEF0F3] py-4 last:border-0 sm:grid-cols-[180px_1fr]">
          <label className="text-[13px] font-medium text-[#374151] sm:pt-[7px]">
            Contact<span className="ml-0.5 text-[#EF4444]">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              name="phone" required type="tel"
              placeholder="+91 98201 24578"
              className={inputCls + ' font-mono text-[12.5px]'}
            />
            <input
              name="email" type="email"
              placeholder="priya@example.com"
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* ── Interest / requirements ─────────────── */}
      <div className="mb-4 rounded-[12px] border border-[#E5E7EB] bg-white px-5">
        <h2 className="border-b border-[#EEF0F3] py-4 text-[13px] font-semibold text-[#111827]">
          Interest
          <span className="ml-1.5 font-normal text-[#9CA3AF]">— what are they looking for?</span>
        </h2>

        {/* Intent toggle */}
        <FormRow label="Looking to" required>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-0.5 rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] p-[3px]">
              {(['buy', 'rent'] as const).map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setIntent(v)}
                  className={[
                    'rounded-[6px] px-5 py-[5px] text-[13px] font-medium transition-all',
                    intent === v
                      ? 'bg-white text-[#111827] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                      : 'text-[#6B7280] hover:text-[#374151]',
                  ].join(' ')}
                >
                  {v === 'buy' ? 'Buy' : 'Rent'}
                </button>
              ))}
            </div>
            <span className="text-[12px] text-[#9CA3AF]">
              {intent === 'buy' ? 'Outright purchase' : 'Lease / rental'}
            </span>
          </div>
        </FormRow>

        {/* Property type chips */}
        <FormRow label="Property type">
          <div className="flex flex-wrap gap-1.5">
            {PROPERTY_TYPES.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setPropType(prev => prev === t.id ? null : t.id)}
                className={[
                  'inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1.5 text-[12.5px] transition-all',
                  propType === t.id
                    ? 'border-[#111827] bg-[#111827] text-white'
                    : 'border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F9FAFB]',
                ].join(' ')}
              >
                <span className="font-mono opacity-65">{t.glyph}</span>
                {t.label}
              </button>
            ))}
          </div>
        </FormRow>

        {/* Project selector */}
        <FormRow label="Project" required>
          {projects.length === 0 ? (
            <p className="text-[13px] text-[#9CA3AF]">No projects available</p>
          ) : (
            <select
              className={selectCls}
              value={projectId}
              onChange={e => handleProjectChange(e.target.value)}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </FormRow>

        {/* Budget + Timeline */}
        <div className="grid grid-cols-1 gap-0 border-b border-[#EEF0F3] py-4 last:border-0 sm:grid-cols-[180px_1fr]">
          <label className="text-[13px] font-medium text-[#374151] sm:pt-[7px]">
            {intent === 'buy' ? 'Budget' : 'Monthly rent'}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <input
              name="budget_display"
              placeholder={intent === 'buy' ? 'e.g. SAR 500K' : 'e.g. SAR 8K/mo'}
              className={inputCls}
            />
            <select
              name="timeline"
              className={selectCls}
            >
              {TIMELINES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <FormRow label="Notes">
          <textarea
            name="query"
            rows={3}
            placeholder="3BHK, sea view preferred. NRI buyer, comfortable on weekend calls."
            className="w-full resize-none rounded-[7px] border border-[#E5E7EB] px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]/50 focus:ring-1 focus:ring-[#2563EB]/20"
          />
        </FormRow>
      </div>

      {/* Consent + actions */}
      <div className="mb-5 rounded-[12px] border border-[#E5E7EB] bg-white p-5">
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            name="consent"
            required
            className="mt-0.5 rounded border-[#D1D5DB] accent-[#2563EB]"
          />
          <span className="text-[12.5px] leading-relaxed text-[#6B7280]">
            I have explicit consent from the client to share their contact details with Rayash Real Estate,
            and they have been informed of our privacy policy.
          </span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/portal"
          className="rounded-[7px] border border-[#E5E7EB] bg-white px-4 py-2 text-[13px] font-medium text-[#374151] hover:bg-[#F9FAFB]"
        >
          Cancel
        </Link>
        <div className="flex-1" />
        <span className="hidden text-[12px] text-[#9CA3AF] sm:block">
          Channel commission: <span className="text-[#111827]">1.25%</span>
        </span>
        <button
          type="submit"
          className="rounded-[7px] bg-[#2563EB] px-5 py-2 text-[13px] font-medium text-white hover:bg-[#1D4ED8]"
        >
          Submit lead →
        </button>
      </div>
    </form>
  )
}
