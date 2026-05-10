'use client'

import { useRef, useState, useTransition } from 'react'
import { Camera, Loader2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { updateProjectCoverImage } from '@/lib/actions/projects'

interface Props {
  projectSlug: string
  projectId: string
  currentCoverUrl: string | null
}

export function ProjectCoverUpload({ projectSlug, projectId, currentCoverUrl }: Props) {
  const [preview, setPreview] = useState<string | null>(currentCoverUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WebP)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB')
      return
    }

    setError(null)
    setUploading(true)

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)

    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const storagePath = `covers/${projectId}-${Date.now()}.${ext}`

      const { error: upErr } = await supabase.storage
        .from('project-files')
        .upload(storagePath, file, { cacheControl: '86400', upsert: true })

      if (upErr) throw new Error(upErr.message)

      // Get public URL
      const { data: urlData } = supabase.storage.from('project-files').getPublicUrl(storagePath)
      const publicUrl = urlData?.publicUrl

      if (!publicUrl) throw new Error('Could not get public URL')

      startTransition(async () => {
        const result = await updateProjectCoverImage(projectSlug, publicUrl)
        if (result?.error) setError(result.error)
        else setPreview(publicUrl)
      })
    } catch (err: any) {
      setError(err.message)
      setPreview(currentCoverUrl) // revert on error
    } finally {
      setUploading(false)
    }
  }

  function handleRemove() {
    setPreview(null)
    startTransition(async () => {
      await updateProjectCoverImage(projectSlug, '')
    })
  }

  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-medium text-content-2">Cover image</label>

      <div className="flex items-start gap-4">
        {/* Preview / placeholder */}
        <div
          className="relative h-[80px] w-[120px] flex-none overflow-hidden rounded-[8px] border border-border bg-surface-2"
          style={!preview ? {
            backgroundImage: 'repeating-linear-gradient(45deg, #E5E7EB 0, #E5E7EB 6px, transparent 0, transparent 50%)',
            backgroundSize: '10px 10px',
          } : undefined}
        >
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Cover" className="h-full w-full object-cover" />
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Loader2 size={20} className="animate-spin text-white" />
            </div>
          )}
          {preview && !uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
              title="Remove image"
            >
              <X size={10} />
            </button>
          )}
        </div>

        {/* Upload button */}
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-[7px] border border-border bg-white px-3 py-2 text-[13px] font-medium text-content hover:bg-surface-2 disabled:opacity-60 transition-colors"
          >
            <Camera size={13} />
            {preview ? 'Change image' : 'Upload image'}
          </button>
          <p className="mt-1 text-[11.5px] text-content-3">JPG, PNG, WebP · max 5 MB · recommended 1200×700</p>
          {error && <p className="mt-1 text-[11.5px] text-red-500">{error}</p>}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
