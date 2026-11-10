import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' }

// Serves AI-generated images from public/generated at request time.
// Why: a production Next build only serves files that existed in /public at startup, so images created
// later (AI designs / try-ons) would 404. next.config.ts rewrites /generated/:name here, which keeps every
// stored imageUrl (e.g. /generated/design_x.png) working unchanged.
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const m = /^[A-Za-z0-9_-]+\.(png|jpe?g|webp)$/i.exec(name) // strict whitelist: no slashes, no traversal
  if (!m) return new Response('Not found', { status: 404 })
  try {
    const buf = await fs.promises.readFile(path.join(process.cwd(), 'public', 'generated', name))
    return new Response(new Uint8Array(buf), {
      headers: { 'Content-Type': MIME[m[1].toLowerCase()], 'Cache-Control': 'public, max-age=31536000, immutable' },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
