'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// ── Save file metadata after client-side Supabase Storage upload ─────────────
// Uses the admin (service-role) client for the INSERT so RLS never blocks it.
// Auth is still verified first with the regular anon client.
export async function saveFileMetadata(payload: {
  projectId: string
  projectSlug: string
  name: string
  originalName: string
  mimeType: string
  sizeBytes: number
  storagePath: string
  publicUrl: string | null
}) {
  // 1. Verify the caller is authenticated
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return { error: 'Unauthorized' }

  // 2. Insert via admin client (bypasses RLS — safe because we verified auth above)
  const admin = createAdminClient()
  const { error } = await admin.from('project_files').insert({
    project_id: payload.projectId,
    name: payload.name,
    original_name: payload.originalName,
    mime_type: payload.mimeType,
    size_bytes: payload.sizeBytes,
    storage_path: payload.storagePath,
    public_url: payload.publicUrl,
    uploaded_by: user.id,
  })

  if (error) return { error: error.message }

  revalidatePath(`/projects/${payload.projectSlug}`)
  return { ok: true }
}

// ── Delete a file from storage + database ────────────────────────────────────
export async function deleteProjectFile(fileId: string, storagePath: string, projectSlug: string) {
  // 1. Verify auth
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return { error: 'Unauthorized' }

  // 2. Verify ownership or head role (using admin client for reliable reads)
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  const { data: file } = await admin.from('project_files').select('uploaded_by').eq('id', fileId).single()

  if (!file) return { error: 'File not found' }
  if ((file as any).uploaded_by !== user.id && (profile as any)?.role !== 'head') {
    return { error: 'Forbidden' }
  }

  // 3. Remove from storage
  await admin.storage.from('project-files').remove([storagePath])

  // 4. Remove from database
  await admin.from('project_files').delete().eq('id', fileId)

  revalidatePath(`/projects/${projectSlug}`)
  return { ok: true }
}

// ── Generate a temporary signed URL for downloading a private file ───────────
export async function getSignedUrl(storagePath: string): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from('project-files')
    .createSignedUrl(storagePath, 3600) // 1 hour

  if (error) return { error: error.message }
  return { url: data.signedUrl }
}

// ── Toggle public sharing on a project ───────────────────────────────────────
export async function toggleProjectPublic(projectId: string, projectSlug: string, isPublic: boolean) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return { error: 'Unauthorized' }

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if ((profile as any)?.role !== 'head') return { error: 'Only heads can change project visibility' }

  await admin.from('projects').update({ is_published: isPublic }).eq('id', projectId)

  revalidatePath(`/projects/${projectSlug}`)
  revalidatePath('/', 'layout')
  return { ok: true }
}

// ── Generate AI summary for a file (calls Anthropic if key is set) ───────────
export async function generateAiSummary(fileId: string, fileUrl: string, mimeType: string, projectSlug: string) {
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return { error: 'Unauthorized' }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { error: 'AI not configured. Set ANTHROPIC_API_KEY in environment.' }

  try {
    const isImage = mimeType.startsWith('image/')
    const isPdf = mimeType === 'application/pdf'

    let summary = ''

    if (isImage || isPdf) {
      const fileRes = await fetch(fileUrl)
      const buffer = await fileRes.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')

      const mediaType = isPdf ? 'application/pdf' : mimeType as any

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-beta': 'pdfs-2024-09-25',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 512,
          messages: [{
            role: 'user',
            content: [
              {
                type: isPdf ? 'document' : 'image',
                source: { type: 'base64', media_type: mediaType, data: base64 },
              },
              {
                type: 'text',
                text: 'Summarise this file in 2-3 sentences for a real estate CRM. Focus on key info like pricing, units, location, amenities.',
              },
            ],
          }],
        }),
      })

      const data = await res.json()
      summary = data.content?.[0]?.text ?? 'Could not extract summary.'
    } else {
      summary = 'AI analysis is available for images and PDF files.'
    }

    // Save summary via admin client
    const admin = createAdminClient()
    await admin.from('project_files').update({ ai_summary: summary }).eq('id', fileId)
    revalidatePath(`/projects/${projectSlug}`)

    return { summary }
  } catch (err: any) {
    return { error: err.message }
  }
}
