'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { CSVImportModal } from './CSVImportModal'
import { useRouter } from 'next/navigation'

interface Props {
  projects: { id: string; name: string }[]
  sources: { id: string; name: string }[]
  projectId?: string
  projectSlug?: string
}

export function LeadsImportButton({ projects, sources, projectId, projectSlug }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState(projectId ?? '')
  const [projectConfirmed, setProjectConfirmed] = useState(!!projectId)
  const router = useRouter()

  function handleSuccess(count: number) {
    setTimeout(() => {
      setOpen(false)
      router.refresh()
    }, 1500)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-[6px] border border-border bg-white px-2.5 py-[5px] text-[13px] font-medium text-content hover:bg-surface-2"
      >
        <Download size={12} /> Import CSV
      </button>

      {open && (
        <>
          {/* Project selector — shown when no projectId pre-set AND not yet confirmed */}
          {!projectConfirmed ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,24,39,0.3)] backdrop-blur-[2px]" onClick={() => setOpen(false)}>
              <div className="w-80 rounded-[12px] border border-border bg-white p-5 shadow-xl" onClick={e => e.stopPropagation()}>
                <h2 className="mb-3 text-[15px] font-semibold">Select project</h2>
                <p className="mb-3 text-[12.5px] text-content-2">Which project should these leads be imported into?</p>
                <select
                  className="w-full rounded-[7px] border border-border px-3 py-2 text-[13px] outline-none focus:border-brand/50"
                  value={selectedProject}
                  onChange={e => setSelectedProject(e.target.value)}
                >
                  <option value="">Choose a project…</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <div className="mt-3 flex justify-end gap-2">
                  <button onClick={() => setOpen(false)} className="rounded-[6px] border border-border px-3 py-1.5 text-[13px]">Cancel</button>
                  <button
                    onClick={() => { if (selectedProject) setProjectConfirmed(true) }}
                    disabled={!selectedProject}
                    className="rounded-[6px] bg-brand px-3 py-1.5 text-[13px] font-medium text-white disabled:opacity-50"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <CSVImportModal
              projectId={selectedProject || projectId!}
              projectSlug={projectSlug ?? ''}
              sources={sources}
              onClose={() => { setOpen(false); setSelectedProject(projectId ?? ''); setProjectConfirmed(!!projectId) }}
              onSuccess={handleSuccess}
            />
          )}
        </>
      )}
    </>
  )
}
