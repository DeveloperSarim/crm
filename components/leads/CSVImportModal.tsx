'use client'

import { useState, useRef, useCallback } from 'react'
import { X, Upload, AlertCircle, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface CSVImportModalProps {
  projectId: string
  projectSlug: string
  sources: { id: string; name: string }[]
  onClose: () => void
  onSuccess: (count: number) => void
}

type ParsedRow = Record<string, string>

const REQUIRED_FIELDS = ['full_name', 'phone'] as const
const FIELD_OPTIONS = [
  { value: 'full_name', label: 'Full Name *' },
  { value: 'phone', label: 'Phone *' },
  { value: 'email', label: 'Email' },
  { value: 'address', label: 'Address' },
  { value: 'query', label: 'Query / Notes' },
  { value: 'budget_display', label: 'Budget' },
  { value: 'intent', label: 'Intent (buy/rent)' },
  { value: 'property_type', label: 'Property Type' },
  { value: '__skip__', label: '— Skip column —' },
]

export function CSVImportModal({ projectId, projectSlug, sources, onClose, onSuccess }: CSVImportModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isDragging, setIsDragging] = useState(false)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [sourceId, setSourceId] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number; failed: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function parseCSV(text: string): { headers: string[]; rows: ParsedRow[] } {
    const lines = text.trim().split(/\r?\n/)
    if (lines.length < 2) return { headers: [], rows: [] }
    const parseRow = (line: string) => {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const c = line[i]
        if (c === '"') { inQuotes = !inQuotes; continue }
        if (c === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue }
        current += c
      }
      result.push(current.trim())
      return result
    }
    const hdrs = parseRow(lines[0])
    const dataRows = lines.slice(1).map(l => {
      const vals = parseRow(l)
      const row: ParsedRow = {}
      hdrs.forEach((h, i) => { row[h] = vals[i] ?? '' })
      return row
    }).filter(r => Object.values(r).some(v => v))
    return { headers: hdrs, rows: dataRows }
  }

  function autoMap(hdrs: string[]): Record<string, string> {
    const map: Record<string, string> = {}
    const aliases: Record<string, string> = {
      name: 'full_name', 'full name': 'full_name', fullname: 'full_name', customer: 'full_name',
      phone: 'phone', mobile: 'phone', contact: 'phone', number: 'phone',
      email: 'email', 'e-mail': 'email', mail: 'email',
      address: 'address', location: 'address', city: 'address',
      notes: 'query', query: 'query', remarks: 'query', requirements: 'query',
      budget: 'budget_display', price: 'budget_display',
      intent: 'intent', type: 'intent', purpose: 'intent',
      property: 'property_type', 'property type': 'property_type',
    }
    hdrs.forEach(h => {
      const key = h.toLowerCase().trim()
      map[h] = aliases[key] ?? '__skip__'
    })
    return map
  }

  function handleFile(file: File) {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      alert('Please upload a .csv file')
      return
    }
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      const { headers: hdrs, rows: dataRows } = parseCSV(text)
      if (!hdrs.length) { alert('Could not parse CSV'); return }
      setHeaders(hdrs)
      setRows(dataRows)
      setMapping(autoMap(hdrs))
      setStep(2)
    }
    reader.readAsText(file)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  function getMappedRows() {
    return rows.map(row => {
      const mapped: Record<string, string> = {}
      headers.forEach(h => {
        const field = mapping[h]
        if (!field || field === '__skip__') return
        let val = row[h] ?? ''
        // Normalise intent so the server accepts it
        if (field === 'intent') {
          const lower = val.toLowerCase().trim()
          if (lower === 'buy' || lower === 'buying' || lower === 'purchase') val = 'buy'
          else if (lower === 'rent' || lower === 'renting' || lower === 'rental') val = 'rent'
          else val = ''
        }
        // Normalise property_type to snake_case lowercase
        if (field === 'property_type') {
          val = val.toLowerCase().trim().replace(/[\s/]+/g, '_')
        }
        mapped[field] = val
      })
      return mapped
    }).filter(r => r.full_name && r.phone)
  }

  const validRows = getMappedRows()
  const missingRequired = REQUIRED_FIELDS.filter(f => !Object.values(mapping).includes(f))

  async function handleImport() {
    setImporting(true)
    try {
      const res = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows, projectId, sourceId: sourceId || undefined }),
      })
      const data = await res.json()
      setResult({ imported: data.imported, skipped: data.skipped ?? 0, failed: data.failed ?? 0 })
      setStep(3)
      onSuccess(data.imported)
    } catch {
      alert('Import failed. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,24,39,0.3)] backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="flex h-[580px] w-[640px] flex-col overflow-hidden rounded-[14px] border border-border bg-white shadow-[0_24px_60px_rgba(17,24,39,0.18)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center border-b border-border px-5 py-4">
          <div>
            <h2 className="text-[15px] font-semibold">Import leads from CSV</h2>
            <p className="text-[12px] text-content-3">Step {step} of 3</p>
          </div>
          <div className="ml-5 flex items-center gap-1.5">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium transition-all',
                  step > s ? 'bg-[#10B981] text-white' : step === s ? 'bg-brand text-white' : 'bg-[#F3F4F6] text-content-3'
                )}>
                  {step > s ? '✓' : s}
                </div>
                {s < 3 && <div className={cn('h-px w-6', step > s ? 'bg-[#10B981]' : 'bg-[#E5E7EB]')} />}
              </div>
            ))}
          </div>
          <div className="flex-1" />
          <button onClick={onClose} className="text-content-3 hover:text-content-2"><X size={16} /></button>
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={cn(
                'flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-[12px] border-2 border-dashed py-12 transition-colors',
                isDragging ? 'border-brand bg-brand/[0.03]' : 'border-border hover:border-content-3 hover:bg-surface-2'
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-white shadow-sm">
                <Upload size={18} className="text-content-3" />
              </div>
              <div className="text-center">
                <div className="text-[14px] font-medium">Drop your CSV file here</div>
                <div className="mt-1 text-[13px] text-content-3">or click to browse</div>
              </div>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
            </div>
            <div className="rounded-[8px] border border-[#DBEAFE] bg-[#EFF6FF] px-4 py-3 text-[12.5px] text-[#1D4ED8]">
              <strong>Required columns:</strong> full_name (or Name), phone (or Mobile/Contact)<br />
              <strong>Optional:</strong> email, address, budget, intent (buy/rent), query, property_type
            </div>
          </div>
        )}

        {/* Step 2: Map fields */}
        {step === 2 && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-auto p-5">
              <p className="mb-4 text-[13px] text-content-2">
                Map your CSV columns to lead fields. <strong>{rows.length} rows</strong> detected.
              </p>

              <div className="mb-4 overflow-hidden rounded-[8px] border border-border">
                <div className="grid grid-cols-2 gap-0 bg-[#FAFAFB] px-3 py-2 text-[11px] font-medium uppercase tracking-[0.04em] text-content-3">
                  <span>CSV column</span><span>Map to field</span>
                </div>
                {headers.map(h => (
                  <div key={h} className="grid grid-cols-2 items-center gap-4 border-t border-[#EEF0F3] px-3 py-2">
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium">{h}</div>
                    <select
                      value={mapping[h] ?? '__skip__'}
                      onChange={e => setMapping(prev => ({ ...prev, [h]: e.target.value }))}
                      className="w-full rounded-[6px] border border-border px-2 py-1.5 text-[12.5px] outline-none focus:border-brand/50"
                    >
                      {FIELD_OPTIONS.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="mb-3">
                <label className="mb-1 block text-[12px] font-medium text-content-2">Lead source (optional)</label>
                <select value={sourceId} onChange={e => setSourceId(e.target.value)}
                  className="rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50">
                  <option value="">None / CSV Import</option>
                  {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {missingRequired.length > 0 && (
                <div className="flex items-center gap-2 rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[12.5px] text-[#B91C1C]">
                  <AlertCircle size={13} /> Missing required: {missingRequired.join(', ')}
                </div>
              )}
              {validRows.length > 0 && missingRequired.length === 0 && (
                <div className="flex items-center gap-2 rounded-[8px] border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-2 text-[12.5px] text-[#047857]">
                  <CheckCircle size={13} /> {validRows.length} valid rows ready to import
                  {rows.length - validRows.length > 0 && ` (${rows.length - validRows.length} skipped — missing required fields)`}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <button onClick={() => setStep(1)} className="inline-flex items-center gap-1.5 text-[13px] text-content-2 hover:text-content">
                <ArrowLeft size={13} /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={missingRequired.length > 0 || validRows.length === 0}
                className="inline-flex items-center gap-1.5 rounded-[7px] bg-brand px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
              >
                Review {validRows.length} rows <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review + import */}
        {step === 3 && !result && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse text-[12.5px]">
                <thead>
                  <tr className="bg-[#FAFAFB]">
                    {['Name', 'Phone', 'Email', 'Budget', 'Intent'].map(h => (
                      <th key={h} className="border-b border-border px-3 py-2 text-left text-[11px] font-medium uppercase tracking-[0.04em] text-content-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {validRows.slice(0, 20).map((row, i) => (
                    <tr key={i} className="border-b border-[#EEF0F3] hover:bg-[#FAFAFB]">
                      <td className="px-3 py-2 font-medium">{row.full_name}</td>
                      <td className="px-3 py-2 font-tabular text-content-2">{row.phone}</td>
                      <td className="px-3 py-2 text-content-2">{row.email || '—'}</td>
                      <td className="px-3 py-2 text-content-2">{row.budget_display || '—'}</td>
                      <td className="px-3 py-2 text-content-2">{row.intent || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {validRows.length > 20 && (
                <div className="px-3 py-2 text-[12px] text-content-3">
                  …and {validRows.length - 20} more rows
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <button onClick={() => setStep(2)} className="inline-flex items-center gap-1.5 text-[13px] text-content-2 hover:text-content">
                <ArrowLeft size={13} /> Back
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="rounded-[7px] bg-brand px-4 py-2 text-[13px] font-medium text-white disabled:opacity-60"
              >
                {importing ? 'Importing…' : `Import ${validRows.length} leads`}
              </button>
            </div>
          </div>
        )}

        {/* Done */}
        {step === 3 && result && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ECFDF5]">
              <CheckCircle size={28} className="text-[#10B981]" />
            </div>
            <div>
              <div className="text-[18px] font-semibold">{result.imported} leads imported</div>
              {result.skipped > 0 && (
                <div className="mt-1 text-[13px] text-[#F59E0B]">{result.skipped} duplicate{result.skipped !== 1 ? 's' : ''} skipped (same phone already exists)</div>
              )}
              {result.failed > 0 && (
                <div className="mt-1 text-[13px] text-[#EF4444]">{result.failed} rows failed</div>
              )}
            </div>
            <button onClick={onClose} className="rounded-[7px] bg-brand px-5 py-2 text-[13px] font-medium text-white">
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
