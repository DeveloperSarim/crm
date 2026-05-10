'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { getLeadsForExport, type ExportLead } from '@/lib/actions/export'

interface Props {
  projectSlug?: string
  label?: string
}

// CSV column headers and field map
const COLUMNS: { header: string; key: keyof ExportLead }[] = [
  { header: 'Ref ID',        key: 'reference_id' },
  { header: 'Name',          key: 'full_name' },
  { header: 'Phone',         key: 'phone' },
  { header: 'Email',         key: 'email' },
  { header: 'Address',       key: 'address' },
  { header: 'Status',        key: 'status' },
  { header: 'Intent',        key: 'intent' },
  { header: 'Property Type', key: 'property_type' },
  { header: 'Budget',        key: 'budget_display' },
  { header: 'Source',        key: 'source' },
  { header: 'Assigned To',   key: 'assigned_to' },
  { header: 'Query',         key: 'query' },
  { header: 'Score',         key: 'score' },
  { header: 'Follow-up Date',  key: 'follow_up_date' },
  { header: 'Follow-up Notes', key: 'follow_up_notes' },
  { header: 'Created',       key: 'created_at' },
  { header: 'Updated',       key: 'updated_at' },
]

function escapeCell(val: unknown): string {
  if (val == null) return ''
  const str = String(val)
  // If contains comma, newline or double-quote, wrap in quotes and escape existing quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toCSV(leads: ExportLead[]): string {
  const header = COLUMNS.map(c => escapeCell(c.header)).join(',')
  const rows = leads.map(lead =>
    COLUMNS.map(c => escapeCell(lead[c.key])).join(',')
  )
  return [header, ...rows].join('\r\n')
}

function downloadFile(content: string, filename: string, mime: string) {
  // UTF-8 BOM — makes Excel open the file with correct encoding (especially for Urdu/Hindi names)
  const BOM = '﻿'
  const blob = new Blob([BOM + content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ExportButton({ projectSlug, label = 'Export' }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const { data, error } = await getLeadsForExport(projectSlug)
      if (error || !data) {
        alert(error ?? 'Failed to export leads')
        return
      }
      if (data.length === 0) {
        alert('No leads to export')
        return
      }
      const csv = toCSV(data)
      const date = new Date().toISOString().slice(0, 10)
      const filename = projectSlug
        ? `leads-${projectSlug}-${date}.csv`
        : `leads-all-${date}.csv`
      downloadFile(csv, filename, 'text/csv;charset=utf-8;')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-[6px] border border-border bg-white px-2.5 py-[5px] text-[13px] font-medium text-content hover:bg-surface-2 disabled:opacity-60 transition-colors"
    >
      {loading
        ? <><Loader2 size={13} className="animate-spin" /> Exporting…</>
        : <><Download size={13} /> {label}</>
      }
    </button>
  )
}
