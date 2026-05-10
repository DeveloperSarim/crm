import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

// Extract a file ID from any Google Drive share URL
function extractDriveFileId(url: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]{10,})/,
    /\/document\/d\/([a-zA-Z0-9_-]{10,})/,
    /\/spreadsheets\/d\/([a-zA-Z0-9_-]{10,})/,
    /\/presentation\/d\/([a-zA-Z0-9_-]{10,})/,
    /[?&]id=([a-zA-Z0-9_-]{10,})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

// Derive a file extension from a content-type header
function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
    'video/x-msvideo': 'avi',
    'application/zip': 'zip',
    'application/x-zip-compressed': 'zip',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'text/plain': 'txt',
    'text/csv': 'csv',
  }
  const clean = mime.split(';')[0].trim().toLowerCase()
  return map[clean] ?? ''
}

// Extract filename (and its extension) from Content-Disposition header
// Handles both: filename="foo.pdf"  and  filename*=UTF-8''foo%20bar.pdf
function filenameFromContentDisposition(cd: string | null): string {
  if (!cd) return ''
  // RFC 5987 encoded: filename*=UTF-8''some%20file.pdf
  const rfcMatch = cd.match(/filename\*\s*=\s*[^']*''([^;\s]+)/i)
  if (rfcMatch) {
    try { return decodeURIComponent(rfcMatch[1]) } catch { /* ignore */ }
  }
  // Simple: filename="some file.pdf"  or  filename=somefile.pdf
  const simpleMatch = cd.match(/filename\s*=\s*["']?([^"';\r\n]+)["']?/i)
  if (simpleMatch) return simpleMatch[1].trim()
  return ''
}

// Try to parse the confirm token from Google's virus-scan warning HTML page
function parseConfirmToken(html: string): string | null {
  const match =
    html.match(/confirm=([0-9A-Za-z_-]+)/) ||
    html.match(/"confirm":"([^"]+)"/) ||
    html.match(/name="confirm"\s+value="([^"]+)"/)
  return match ? match[1] : null
}

interface DownloadResult {
  buffer: ArrayBuffer
  mimeType: string
  contentDisposition: string | null
}

export async function POST(req: Request) {
  // 1. Auth check
  const supabase = await createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse body
  const { projectId, projectSlug, displayName, driveUrl } = await req.json() as {
    projectId: string
    projectSlug: string
    displayName: string
    driveUrl: string
  }

  if (!projectId || !driveUrl) {
    return NextResponse.json({ error: 'Missing projectId or driveUrl' }, { status: 400 })
  }

  // 3. Extract file ID
  const fileId = extractDriveFileId(driveUrl)
  if (!fileId) {
    return NextResponse.json({
      error: 'Cannot read a file ID from that URL. Use a direct file share link, not a folder link.',
    }, { status: 400 })
  }

  // 4. Attempt download — try multiple URL patterns
  const candidateUrls = [
    `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${fileId}`,
  ]

  const fetchHeaders = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
  }

  let download: DownloadResult | null = null
  let lastError = ''

  for (const url of candidateUrls) {
    try {
      const resp = await fetch(url, { redirect: 'follow', headers: fetchHeaders })
      if (!resp.ok) { lastError = `HTTP ${resp.status} from Google Drive`; continue }

      const ct = resp.headers.get('content-type') ?? ''
      const cleanCt = ct.split(';')[0].trim()

      if (cleanCt === 'text/html') {
        // Google returned a virus-warning page — parse confirm token and retry
        const html = await resp.text()
        const token = parseConfirmToken(html)
        if (token) {
          const retryUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${token}`
          const retry = await fetch(retryUrl, { redirect: 'follow', headers: fetchHeaders })
          if (retry.ok && !(retry.headers.get('content-type') ?? '').includes('text/html')) {
            download = {
              buffer: await retry.arrayBuffer(),
              mimeType: (retry.headers.get('content-type') ?? 'application/octet-stream').split(';')[0].trim(),
              contentDisposition: retry.headers.get('content-disposition'),
            }
            break
          }
        }
        lastError = 'Google Drive returned a confirmation page. Make sure the file is set to "Anyone with the link can view".'
        continue
      }

      download = {
        buffer: await resp.arrayBuffer(),
        mimeType: cleanCt || 'application/octet-stream',
        contentDisposition: resp.headers.get('content-disposition'),
      }
      break
    } catch (e: any) {
      lastError = e.message
    }
  }

  if (!download || download.buffer.byteLength === 0) {
    return NextResponse.json({
      error: lastError || 'Could not download file from Google Drive. Make sure sharing is set to "Anyone with the link can view".',
    }, { status: 422 })
  }

  // 5. Determine file extension
  //    Priority: mime-type map → Content-Disposition filename → display name → 'bin'
  const { buffer: fileBuffer, mimeType, contentDisposition } = download

  let ext = extFromMime(mimeType)

  if (!ext) {
    // Try to get from Content-Disposition header (most reliable for octet-stream)
    const cdFilename = filenameFromContentDisposition(contentDisposition)
    if (cdFilename && cdFilename.includes('.')) {
      ext = cdFilename.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() ?? ''
    }
  }

  if (!ext) {
    // Try to get from the user-supplied display name
    const userExt = (displayName || '').trim().split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() ?? ''
    if (userExt && userExt.length <= 5 && userExt !== displayName.toLowerCase()) {
      ext = userExt
    }
  }

  if (!ext) ext = 'bin'

  // Use the real filename from Content-Disposition as the original_name when available
  const cdFilename = filenameFromContentDisposition(contentDisposition)
  const safeName = `${Date.now()}-gdrive-${fileId.slice(0, 8)}.${ext}`
  const originalName = (displayName || '').trim() || cdFilename || safeName

  const storagePath = `${projectId}/${safeName}`

  // 6. Upload to Supabase Storage
  const admin = createAdminClient()
  const { error: uploadErr } = await admin.storage
    .from('project-files')
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadErr) {
    return NextResponse.json({ error: `Storage error: ${uploadErr.message}` }, { status: 500 })
  }

  const { data: urlData } = admin.storage.from('project-files').getPublicUrl(storagePath)

  // 7. Save metadata to DB
  const { data: inserted, error: dbErr } = await admin
    .from('project_files')
    .insert({
      project_id: projectId,
      name: safeName,
      original_name: originalName,
      mime_type: mimeType,
      size_bytes: fileBuffer.byteLength,
      storage_path: storagePath,
      public_url: urlData?.publicUrl ?? null,
      uploaded_by: user.id,
    })
    .select('id')
    .single()

  if (dbErr) {
    return NextResponse.json({ error: `Database error: ${dbErr.message}` }, { status: 500 })
  }

  revalidatePath(`/projects/${projectSlug}`)

  return NextResponse.json({
    ok: true,
    file: {
      id: (inserted as any)?.id ?? Math.random().toString(),
      name: safeName,
      original_name: originalName,
      mime_type: mimeType,
      size_bytes: fileBuffer.byteLength,
      storage_path: storagePath,
      public_url: urlData?.publicUrl ?? null,
      is_public: true,
      uploaded_at: new Date().toISOString(),
      uploaded_by: user.id,
    },
  })
}
