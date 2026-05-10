'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'

const PROPERTY_TYPES = [
  { id: 'apartment', label: 'Apartment', glyph: '▤' },
  { id: 'villa', label: 'Villa', glyph: '◮' },
  { id: 'building', label: 'Building', glyph: '▦' },
  { id: 'land', label: 'Land / Plot', glyph: '▱' },
  { id: 'office', label: 'Office', glyph: '◫' },
  { id: 'commercial', label: 'Commercial', glyph: '◧' },
  { id: 'retail', label: 'Retail', glyph: '◨' },
  { id: 'warehouse', label: 'Warehouse', glyph: '▭' },
  { id: 'other', label: 'Other', glyph: '·' },
]

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

// Must be rendered inside a <form> to access useFormStatus
function SubmitBtn({ projectSlug }: { projectSlug: string }) {
  const { pending } = useFormStatus()
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
      <Link
        href={`/portal/${projectSlug}`}
        className="rounded-[7px] border border-[#E5E7EB] bg-white px-4 py-2.5 text-center text-[13px] font-medium text-[#374151] hover:bg-[#F9FAFB] sm:py-2"
      >
        Cancel
      </Link>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-[7px] bg-[#2563EB] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#1D4ED8] disabled:opacity-70 sm:py-2"
      >
        {pending ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Submitting…
          </>
        ) : (
          'Submit lead →'
        )}
      </button>
    </div>
  )
}

interface SubmitLeadFormProps {
  projectId: string
  projectSlug: string
  projectName: string
  allowedPropertyTypes?: string[]
  showError?: boolean
  action: (formData: FormData) => Promise<void>
}

export function SubmitLeadForm({ projectId, projectSlug, projectName, allowedPropertyTypes = [], showError, action }: SubmitLeadFormProps) {
  const [intent, setIntent] = useState<'buy' | 'rent'>('buy')
  const [propType, setPropType] = useState<string | null>(null)

  // If the project has configured types, show only those; otherwise show all
  const visibleTypes = allowedPropertyTypes.length > 0
    ? PROPERTY_TYPES.filter(t => allowedPropertyTypes.includes(t.id))
    : PROPERTY_TYPES

  return (
    <form action={action}>
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="project_slug" value={projectSlug} />
      <input type="hidden" name="intent" value={intent} />
      <input type="hidden" name="property_type" value={propType ?? ''} />

      {/* Error banner */}
      {showError && (
        <div className="mb-4 rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#B91C1C]">
          Something went wrong while submitting your lead. Please try again or contact support.
        </div>
      )}

      {/* Intent toggle */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-1 rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] p-[3px]">
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
      </div>

      {/* Form sections */}
      <div className="mb-5 rounded-[10px] border border-[#E5E7EB] bg-white px-5">
        <h2 className="border-b border-[#EEF0F3] py-4 text-[13px] font-semibold text-[#111827]">Client details</h2>

        <FormRow label="Full name" required>
          <input
            name="full_name"
            required
            placeholder="Client's full name"
            className="w-full rounded-[7px] border border-[#E5E7EB] px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]/50 focus:ring-1 focus:ring-[#2563EB]/20"
          />
        </FormRow>

        <FormRow label="Phone" required>
          <input
            name="phone"
            required
            type="tel"
            placeholder="+91 98200 00000"
            className="w-full rounded-[7px] border border-[#E5E7EB] px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]/50 focus:ring-1 focus:ring-[#2563EB]/20"
          />
        </FormRow>

        <FormRow label="Email">
          <input
            name="email"
            type="email"
            placeholder="client@email.com"
            className="w-full rounded-[7px] border border-[#E5E7EB] px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]/50 focus:ring-1 focus:ring-[#2563EB]/20"
          />
        </FormRow>
      </div>

      <div className="mb-5 rounded-[10px] border border-[#E5E7EB] bg-white px-5">
        <h2 className="border-b border-[#EEF0F3] py-4 text-[13px] font-semibold text-[#111827]">Requirements</h2>

        <FormRow label="Property type">
          <div className="flex flex-wrap gap-1.5">
            {visibleTypes.map(t => (
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

        <FormRow label="Budget" hint="e.g. SAR 500K or SAR 8K/mo">
          <input
            name="budget_display"
            placeholder={intent === 'buy' ? 'e.g. SAR 500K' : 'e.g. SAR 8K/mo'}
            className="w-full rounded-[7px] border border-[#E5E7EB] px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]/50 focus:ring-1 focus:ring-[#2563EB]/20"
          />
        </FormRow>

        <FormRow label="Notes">
          <textarea
            name="query"
            rows={3}
            placeholder="Any specific requirements or notes…"
            className="w-full resize-none rounded-[7px] border border-[#E5E7EB] px-3 py-2 text-[13px] outline-none focus:border-[#2563EB]/50 focus:ring-1 focus:ring-[#2563EB]/20"
          />
        </FormRow>

        <FormRow label="Consent">
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              name="consent"
              required
              className="mt-0.5 rounded border-[#D1D5DB] accent-[#2563EB]"
            />
            <span className="text-[12.5px] leading-relaxed text-[#6B7280]">
              I confirm that the client has consented to share their details with Rayash for the purpose of this enquiry.
            </span>
          </label>
        </FormRow>
      </div>

      {/* Action buttons — SubmitBtn reads useFormStatus for the spinner */}
      <SubmitBtn projectSlug={projectSlug} />
    </form>
  )
}
