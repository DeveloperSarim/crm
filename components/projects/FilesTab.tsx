'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { saveFileMetadata, deleteProjectFile, getSignedUrl } from '@/lib/actions/files'
import {
  Upload, Trash2, Download, FileText, Image, Video,
  Archive, File, Link2, X, Loader2, AlertCircle, CheckCircle2, Check,
  FolderOpen,
} from 'lucide-react'

interface ProjectFile {
  id: string
  name: string
  original_name: string
  mime_type: string
  size_bytes: number
  storage_path: string
  public_url: string | null
  is_public: boolean
  uploaded_at: string
  uploaded_by: string | null
}

interface FilesTabProps {
  projectId: string
  projectSlug: string
  initialFiles: ProjectFile[]
  isHead: boolean
}

function FileIcon({ mimeType, size = 18 }: { mimeType: string; size?: number }) {
  if (mimeType.startsWith('image/')) return <Image size={size} className="text-blue-500" />
  if (mimeType.startsWith('video/')) return <Video size={size} className="text-purple-500" />
  if (mimeType === 'application/pdf') return <FileText size={size} className="text-red-500" />
  if (mimeType.includes('word') || mimeType.includes('document')) return <FileText size={size} className="text-blue-600" />
  if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('csv')) return <FileText size={size} className="text-green-600" />
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return <Archive size={size} className="text-amber-500" />
  return <File size={size} className="text-content-3" />
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-SA', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface UploadItem {
  id: string
  filename: string
  progress: number
  status: 'uploading' | 'saving' | 'done' | 'error'
  error?: string
}

export function FilesTab({ projectId, projectSlug, initialFiles, isHead }: FilesTabProps) {
  const [files, setFiles] = useState<ProjectFile[]>(initialFiles)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [dragging, setDragging] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [copying, setCopying] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  // Google Drive link panel
  const [showDrivePanel, setShowDrivePanel] = useState(false)
  const [driveUrl, setDriveUrl] = useState('')
  const [driveName, setDriveName] = useState('')
  const [driveSaving, setDriveSaving] = useState(false)
  const [driveError, setDriveError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(true) }, [])
  const handleDragLeave = useCallback(() => setDragging(false), [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const dropped = Array.from(e.dataTransfer.files)
    if (dropped.length) uploadFiles(dropped)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function uploadFiles(fileList: File[]) {
    for (const file of fileList) {
      const uploadId = Math.random().toString(36).slice(2)
      const ext = file.name.split('.').pop() ?? ''
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const storagePath = `${projectId}/${safeName}`

      setUploads(prev => [...prev, { id: uploadId, filename: file.name, progress: 0, status: 'uploading' }])

      const { error: upErr } = await supabase.storage
        .from('project-files')
        .upload(storagePath, file, { cacheControl: '3600', upsert: false })

      if (upErr) {
        setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'error', error: upErr.message } : u))
        continue
      }

      setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, progress: 90, status: 'saving' } : u))

      const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(storagePath)

      const result = await saveFileMetadata({
        projectId, projectSlug, name: safeName, originalName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size, storagePath, publicUrl: urlData?.publicUrl ?? null,
      })

      if (result?.error) {
        setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, status: 'error', error: result.error } : u))
        continue
      }

      setFiles(prev => [{
        id: Math.random().toString(), name: safeName, original_name: file.name,
        mime_type: file.type || 'application/octet-stream', size_bytes: file.size,
        storage_path: storagePath, public_url: urlData?.publicUrl ?? null,
        is_public: false, uploaded_at: new Date().toISOString(), uploaded_by: null,
      }, ...prev])

      setUploads(prev => prev.map(u => u.id === uploadId ? { ...u, progress: 100, status: 'done' } : u))
      setTimeout(() => setUploads(prev => prev.filter(u => u.id !== uploadId)), 2000)
    }
  }

  async function handleDownload(file: ProjectFile) {
    let url = file.public_url
    if (!url) {
      const result = await getSignedUrl(file.storage_path)
      if (result.error || !result.url) { alert(result.error ?? 'Could not get link'); return }
      url = result.url
    }
    const a = document.createElement('a')
    a.href = url; a.download = file.original_name; a.target = '_blank'; a.click()
  }

  // ── Copy shareable link to clipboard ──────────────────────────────────────
  async function handleCopyLink(file: ProjectFile) {
    setCopying(file.id)
    try {
      let url = file.public_url
      if (!url) {
        const result = await getSignedUrl(file.storage_path)
        if (result.error || !result.url) { alert(result.error ?? 'Could not get link'); return }
        url = result.url
      }
      await navigator.clipboard.writeText(url)
      setCopiedId(file.id)
      setTimeout(() => setCopiedId(null), 2000)
    } finally {
      setCopying(null)
    }
  }

  async function handleDelete(file: ProjectFile) {
    if (!confirm(`Delete "${file.original_name}"? This cannot be undone.`)) return
    setDeleting(file.id)
    const result = await deleteProjectFile(file.id, file.storage_path, projectSlug)
    if (result?.error) { alert(result.error); setDeleting(null); return }
    setFiles(prev => prev.filter(f => f.id !== file.id))
    setDeleting(null)
  }

  async function handleSaveDriveLink(e: React.FormEvent) {
    e.preventDefault()
    if (!driveUrl.trim()) return
    setDriveSaving(true)
    setDriveError(null)

    try {
      const res = await fetch('/api/projects/upload-from-drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          projectSlug,
          displayName: driveName.trim() || 'Google Drive file',
          driveUrl: driveUrl.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setDriveError(data.error ?? `Upload failed (HTTP ${res.status})`)
        setDriveSaving(false)
        return
      }
      if (data.file) {
        setFiles(prev => [data.file, ...prev])
      }
      setDriveUrl('')
      setDriveName('')
      setShowDrivePanel(false)
    } catch (err: any) {
      setDriveError(err.message ?? 'Network error — please try again.')
    } finally {
      setDriveSaving(false)
    }
  }

  return (
    <div className="p-6">
      {/* Upload zone */}
      <div
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`mb-4 flex cursor-pointer items-center gap-4 rounded-[10px] border-2 border-dashed px-6 py-5 transition-all ${
          dragging
            ? 'border-brand bg-brand/5 shadow-[0_0_0_3px_rgba(37,99,235,0.08)]'
            : 'border-border bg-[#FAFAFA] hover:border-brand/40 hover:bg-[#F5F8FF]'
        }`}
      >
        <div className={`flex h-9 w-9 flex-none items-center justify-center rounded-[8px] transition-colors ${
          dragging ? 'bg-brand text-white' : 'bg-white border border-border text-content-3'
        }`}>
          <Upload size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-content">
            {dragging ? 'Release to upload' : 'Click to upload or drag & drop files'}
          </div>
          <div className="text-[12px] text-content-3">PDF, Word, Excel, Images, Videos · up to 50 MB each</div>
        </div>
        <div className="hidden text-[12px] text-brand sm:block">Browse files</div>
        <input ref={fileInputRef} type="file" multiple className="hidden"
          onChange={e => {
            const selected = Array.from(e.target.files ?? [])
            if (selected.length) uploadFiles(selected)
            e.target.value = ''
          }}
        />
      </div>

      {/* Google Drive link button */}
      {!showDrivePanel && (
        <button
          onClick={() => setShowDrivePanel(true)}
          className="mb-4 flex w-full items-center gap-3 rounded-[10px] border border-dashed border-[#E5E7EB] bg-white px-5 py-3 text-left transition-colors hover:border-[#4285F4]/50 hover:bg-[#F8FAFF]"
        >
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded-[7px] border border-[#E5E7EB] bg-[#F8FAFF]">
            <FolderOpen size={15} className="text-[#4285F4]" />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-medium text-[#374151]">Import from Google Drive</div>
            <div className="text-[12px] text-[#9CA3AF]">Paste a shared file link — it will be downloaded and stored here</div>
          </div>
        </button>
      )}

      {/* Google Drive link panel */}
      {showDrivePanel && (
        <form onSubmit={handleSaveDriveLink} className="mb-4 overflow-hidden rounded-[10px] border border-[#4285F4]/30 bg-[#F8FAFF]">
          <div className="flex items-center justify-between border-b border-[#4285F4]/20 px-4 py-3">
            <div className="flex items-center gap-2">
              <FolderOpen size={14} className="text-[#4285F4]" />
              <span className="text-[13px] font-medium text-[#111827]">Import from Google Drive</span>
            </div>
            <button type="button" onClick={() => { setShowDrivePanel(false); setDriveUrl(''); setDriveName(''); setDriveError(null) }}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[#9CA3AF] hover:bg-[#E5E7EB] hover:text-[#374151]">
              <X size={13} />
            </button>
          </div>
          <div className="space-y-3 p-4">
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-[#374151]">Google Drive URL <span className="text-red-400">*</span></label>
              <input
                type="url"
                value={driveUrl}
                onChange={e => setDriveUrl(e.target.value)}
                required
                placeholder="https://drive.google.com/drive/folders/… or /file/d/…"
                className="w-full rounded-[7px] border border-[#E5E7EB] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#4285F4]/60 focus:ring-2 focus:ring-[#4285F4]/15"
              />
              <p className="mt-1 text-[11px] text-[#9CA3AF]">File must be shared as "Anyone with the link can view". Only direct file links work — not folder links.</p>
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-[#374151]">Display name</label>
              <input
                type="text"
                value={driveName}
                onChange={e => setDriveName(e.target.value)}
                placeholder="e.g. Brochures Folder"
                className="w-full rounded-[7px] border border-[#E5E7EB] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#4285F4]/60 focus:ring-2 focus:ring-[#4285F4]/15"
              />
            </div>
            {driveError && (
              <div className="rounded-[6px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">{driveError}</div>
            )}
            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => { setShowDrivePanel(false); setDriveUrl(''); setDriveName(''); setDriveError(null) }}
                className="rounded-[7px] border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12.5px] font-medium text-[#374151] hover:bg-[#F9FAFB]">
                Cancel
              </button>
              <button type="submit" disabled={driveSaving || !driveUrl.trim()}
                className="inline-flex items-center gap-1.5 rounded-[7px] bg-[#4285F4] px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-[#3367D6] disabled:opacity-60">
                {driveSaving
                  ? <><Loader2 size={12} className="animate-spin" /> Downloading & uploading…</>
                  : <><Upload size={12} /> Import file</>
                }
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Upload progress */}
      {uploads.length > 0 && (
        <div className="mb-4 space-y-2">
          {uploads.map(u => (
            <div key={u.id} className="flex items-center gap-3 rounded-[8px] border border-border bg-white px-3.5 py-2.5">
              {u.status === 'uploading' || u.status === 'saving'
                ? <Loader2 size={14} className="animate-spin text-brand flex-none" />
                : u.status === 'done'
                  ? <CheckCircle2 size={14} className="text-green-500 flex-none" />
                  : <AlertCircle size={14} className="text-red-500 flex-none" />
              }
              <div className="flex-1 min-w-0">
                <div className="truncate text-[12.5px] font-medium">{u.filename}</div>
                {u.status === 'uploading' && (
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
                    <div className="h-full animate-pulse rounded-full bg-brand" style={{ width: '60%' }} />
                  </div>
                )}
                {u.error && <div className="text-[11.5px] text-red-500 mt-0.5">{u.error}</div>}
                {u.status === 'saving' && <div className="text-[11.5px] text-content-3">Saving…</div>}
                {u.status === 'done' && <div className="text-[11.5px] text-green-600">Uploaded</div>}
              </div>
              <button onClick={() => setUploads(prev => prev.filter(x => x.id !== u.id))} className="flex-none text-content-3 hover:text-content">
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Files list */}
      {files.length === 0 ? (
        <div className="rounded-[10px] border border-border bg-white px-4 py-10 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-[8px] border border-border bg-surface-2 text-content-3">
            <File size={18} />
          </div>
          <div className="text-[13.5px] font-semibold text-content">No files uploaded yet</div>
          <div className="mt-1 text-[12.5px] text-content-2">Upload brochures, floor plans, legal docs, images and more.</div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[10px] border border-border bg-white">
          <div className="grid border-b border-border bg-[#FAFAFB] px-4 py-2.5"
            style={{ gridTemplateColumns: '2fr 80px 110px 120px' }}>
            {['File', 'Size', 'Uploaded', 'Actions'].map(h => (
              <span key={h} className="text-[11px] font-medium uppercase tracking-[0.04em] text-content-3">{h}</span>
            ))}
          </div>

          {files.map((file, idx) => (
            <div key={file.id} className={idx > 0 ? 'border-t border-[#EEF0F3]' : ''}>
              <div className="grid items-center px-4 py-3 hover:bg-[#FAFAFB] transition-colors"
                style={{ gridTemplateColumns: '2fr 80px 110px 120px' }}>
                {/* Name */}
                <div className="min-w-0 pr-4 flex items-center gap-2">
                  <FileIcon mimeType={file.mime_type} size={14} />
                  <div className="min-w-0">
                    <span className="block truncate text-[13px] font-medium">{file.original_name}</span>
                  </div>
                </div>

                {/* Size */}
                <span className="font-tabular text-[12.5px] text-content-2">{formatBytes(file.size_bytes)}</span>

                {/* Date */}
                <span className="text-[12.5px] text-content-2">{formatDate(file.uploaded_at)}</span>

                {/* Actions */}
                <div className="flex items-center gap-0.5">
                  {/* Download */}
                  <button onClick={() => handleDownload(file)} title="Download"
                    className="flex h-7 w-7 items-center justify-center rounded-[5px] text-content-3 hover:bg-[#F3F4F6] hover:text-content transition-colors">
                    <Download size={13} />
                  </button>

                  {/* Copy shareable link */}
                  <button
                    onClick={() => handleCopyLink(file)}
                    disabled={copying === file.id}
                    title={copiedId === file.id ? 'Link copied!' : 'Copy shareable link'}
                    className={`flex h-7 w-7 items-center justify-center rounded-[5px] transition-colors disabled:opacity-40 ${
                      copiedId === file.id
                        ? 'bg-green-50 text-green-600'
                        : 'text-content-3 hover:bg-[#EFF4FF] hover:text-brand'
                    }`}
                  >
                    {copying === file.id
                      ? <Loader2 size={13} className="animate-spin" />
                      : copiedId === file.id
                        ? <Check size={13} />
                        : <Link2 size={13} />
                    }
                  </button>

                  {/* Delete (head only) */}
                  {isHead && (
                    <button onClick={() => handleDelete(file)} disabled={deleting === file.id}
                      title="Delete"
                      className="flex h-7 w-7 items-center justify-center rounded-[5px] text-content-3 hover:bg-red-50 hover:text-red-500 disabled:opacity-40 transition-colors">
                      {deleting === file.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
