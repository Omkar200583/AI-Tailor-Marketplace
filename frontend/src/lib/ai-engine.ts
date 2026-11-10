// Server-side client for the Python AI engine (FastAPI, see /engine/ai-engine).
// Only imported from route handlers — the engine key never reaches the browser.
//
//   AI_ENGINE_URL  e.g. http://localhost:8000   (empty/unset = engine disabled, built-in fallbacks are used)
//   AI_ENGINE_KEY  must equal INTERNAL_API_KEY in the engine's .env
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export class AiEngineError extends Error {
  status: number
  constructor(message: string, status = 502) {
    super(message)
    this.name = 'AiEngineError'
    this.status = status
  }
}

export function engineBase(): string {
  return (process.env.AI_ENGINE_URL || '').trim().replace(/\/+$/, '')
}

export function aiEngineEnabled(): boolean {
  return engineBase().length > 0
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return { 'x-api-key': process.env.AI_ENGINE_KEY || '', ...extra }
}

async function send<T>(path_: string, init: RequestInit, timeoutMs: number): Promise<T> {
  if (!aiEngineEnabled()) throw new AiEngineError('AI engine is not configured (AI_ENGINE_URL)', 503)
  let res: Response
  try {
    res = await fetch(`${engineBase()}${path_}`, { ...init, signal: AbortSignal.timeout(timeoutMs), cache: 'no-store' })
  } catch (e) {
    const timedOut = e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError')
    throw new AiEngineError(timedOut ? 'AI engine timed out' : `AI engine unreachable at ${engineBase()}`, 503)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const d = data as { message?: string; detail?: string; error?: string }
    const msg = d.message || (typeof d.detail === 'string' ? d.detail : '') || d.error || `AI engine error (${res.status})`
    throw new AiEngineError(res.status === 401 ? 'AI engine rejected the API key (check AI_ENGINE_KEY)' : msg, res.status === 401 ? 502 : res.status)
  }
  return data as T
}

export function engineJson<T>(path_: string, body: unknown, timeoutMs = 30_000): Promise<T> {
  return send<T>(path_, { method: 'POST', headers: headers({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) }, timeoutMs)
}

export function engineForm<T>(path_: string, form: FormData, timeoutMs = 180_000): Promise<T> {
  // No Content-Type header: fetch sets the multipart boundary itself.
  return send<T>(path_, { method: 'POST', headers: headers(), body: form }, timeoutMs)
}

export async function engineHealth(): Promise<{ enabled: boolean; reachable: boolean; mongodb?: boolean }> {
  if (!aiEngineEnabled()) return { enabled: false, reachable: false }
  try {
    const h = await send<{ status: string; mongodb?: boolean }>('/health', { method: 'GET' }, 4000)
    return { enabled: true, reachable: h.status === 'ok', mongodb: h.mongodb }
  } catch {
    return { enabled: true, reachable: false }
  }
}

// ---------- image helpers ----------

const PUBLIC_DIR = () => path.join(process.cwd(), 'public')

/** Read an image from a data: URL, an http(s) URL, or a site-relative /path in /public. */
export async function readImageBytes(src: string): Promise<{ bytes: Buffer; mime: string } | null> {
  try {
    if (src.startsWith('data:')) {
      const m = /^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(src)
      if (!m) return null
      return { bytes: m[2] ? Buffer.from(m[3], 'base64') : Buffer.from(decodeURIComponent(m[3])), mime: m[1] }
    }
    if (/^https?:\/\//i.test(src)) {
      const r = await fetch(src, { signal: AbortSignal.timeout(20_000) })
      if (!r.ok) return null
      return { bytes: Buffer.from(await r.arrayBuffer()), mime: r.headers.get('content-type')?.split(';')[0] || 'image/png' }
    }
    if (src.startsWith('/')) {
      const full = path.join(PUBLIC_DIR(), path.normalize(src).replace(/^(\.\.[/\\])+/, ''))
      if (!full.startsWith(PUBLIC_DIR())) return null
      const ext = path.extname(full).toLowerCase()
      return { bytes: fs.readFileSync(full), mime: ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'image/png' }
    }
  } catch {
    /* fall through */
  }
  return null
}

/**
 * Images the engine stored on its own disk (no Cloudinary) are copied into /public/generated so the
 * app serves them same-origin, exactly like before. Cloudinary (or any other host) URLs are kept as-is.
 */
export async function persistEngineImage(url: string, prefix: string): Promise<string> {
  if (!url.startsWith(engineBase() + '/')) return url
  const img = await readImageBytes(url)
  if (!img) throw new AiEngineError('Could not download the generated image from the AI engine', 502)
  const dir = path.join(PUBLIC_DIR(), 'generated')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const filename = `${prefix}_${crypto.randomBytes(6).toString('hex')}.png`
  fs.writeFileSync(path.join(dir, filename), img.bytes)
  return `/generated/${filename}`
}
