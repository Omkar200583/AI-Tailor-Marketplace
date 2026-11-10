import { getSessionUser, requireAuth, json } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

// Allowed MIME types and max size per image
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const MAX_FILES = 8

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

// POST /api/v1/upload
// Accepts multipart/form-data with field `files` (one or more).
// Returns { urls: string[] } of publicly accessible image paths.
export async function POST(req: Request) {
  const user = await getSessionUser()
 const denied = requireAuth(user, ['CUSTOMER', 'SELLER', 'DESIGNER', 'ADMIN'])
  if (denied) return denied

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return json({ error: 'Invalid multipart form data' }, 400)
  }

  const files = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0)

  if (files.length === 0) {
    return json({ error: 'No files provided' }, 400)
  }

  if (files.length > MAX_FILES) {
    return json({ error: `You can upload at most ${MAX_FILES} files at once.` }, 400)
  }

  // Validate every file first — fail fast before writing anything to disk.
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return json(
        { error: `File "${file.name}" has unsupported type (${file.type || 'unknown'}). Allowed: JPG, PNG, WEBP.` },
        400,
      )
    }
    if (file.size > MAX_SIZE) {
      return json({ error: `File "${file.name}" is too large. Maximum 5 MB per image.` }, 400)
    }
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  try {
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }
  } catch (e) {
    console.error('upload mkdir error', e)
    return json({ error: 'Server could not prepare upload directory' }, 500)
  }

  const urls: string[] = []

  try {
    for (const file of files) {
      const ext = EXT_BY_TYPE[file.type] || 'jpg'
      const filename = `${randomUUID()}.${ext}`
      const filepath = path.join(uploadDir, filename)
      const buffer = Buffer.from(await file.arrayBuffer())
      await writeFile(filepath, buffer)
      // Public URL path (served by Next.js from /public)
      urls.push(`/uploads/${filename}`)
    }
  } catch (e) {
    console.error('upload write error', e)
    return json({ error: 'Failed to save one or more files' }, 500)
  }

  return json({ urls }, 201)
}
