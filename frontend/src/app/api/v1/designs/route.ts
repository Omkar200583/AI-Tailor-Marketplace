import { db } from '@/lib/db'
import { getSessionUser, requireAuth, json } from '@/lib/auth'
import { parseJson } from '@/lib/helpers'
import { aiEngineEnabled, engineJson, persistEngineImage } from '@/lib/ai-engine'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export const maxDuration = 120

// GET /api/v1/designs — history
export async function GET() {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied

  const designs = await db.design.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: 'desc' },
    take: 40,
  })
  return json({
    designs: designs.map((d) => ({
      ...d,
      colors: parseJson<string[]>(d.colors, []),
    })),
  })
}

// POST /api/v1/designs — generate AI fashion design image (real image model)

export async function POST(req: Request) {
  const user = await getSessionUser()
  const denied = requireAuth(user, ['CUSTOMER', 'DESIGNER', 'SELLER'])
  if (denied) return denied

  try {
    const body = await req.json()

    const { prompt, category, colors, fabric } = body

    if (!prompt || !String(prompt).trim()) {
      return json({ error: 'Describe your design idea first' }, 400)
    }

    const colorText = Array.isArray(colors) ? colors.join(', ') : ''

    const enginePrompt = [
      String(category || 'kurta'),
      String(prompt).slice(0, 300),
      colorText ? `in ${colorText} colors` : '',
      fabric ? `${fabric} fabric` : '',
      'professional Indian fashion design, detailed embroidery, realistic textile textures, full garment view, studio photography'
    ].filter(Boolean).join(', ')

    let imageUrl = ''
    let engineError = ''

    if (aiEngineEnabled()) {
      try {
        const out = await engineJson<{
          designs?: { image_url?: string }[]
        }>(
          '/api/v1/design/generate',
          {
            prompt: enginePrompt,
            num_variations: 1,
            user_id: user!.id
          },
          170000
        )

        const image = out.designs?.[0]?.image_url

        if (!image) {
          throw new Error('AI Engine returned no generated image')
        }

        imageUrl = await persistEngineImage(image, 'design')

        if (!imageUrl) {
          throw new Error('Failed to persist generated image')
        }

      } catch (error) {
        engineError = error instanceof Error
          ? error.message
          : String(error)

        console.error('AI Engine generation failed:', engineError)
      }
    } else {
      engineError = 'Python AI Engine is disabled or not configured'
    }

    if (!imageUrl) {
      console.error('Design generation unavailable:', engineError)

      return json({
        error: 'AI image generation is currently unavailable.',
        details: engineError,
        code: 'AI_GENERATION_FAILED'
      }, 503)
    }

    const design = await db.design.create({
      data: {
        userId: user!.id,
        title: String(prompt).slice(0, 60),
        prompt: String(prompt),
        category: String(category || 'Kurta'),
        colors: JSON.stringify(Array.isArray(colors) ? colors : []),
        fabric: String(fabric || ''),
        imageUrl,
        status: 'GENERATED'
      }
    })

    return json({
      success: true,
      design: {
        ...design,
        colors: parseJson<string[]>(design.colors, [])
      }
    }, 201)

  } catch (error) {
    console.error('Design API error:', error)

    return json({
      error: 'Design generation failed',
      details: error instanceof Error ? error.message : String(error)
    }, 500)
  }
}

