import { db } from '@/lib/db'
import { getSessionUser, requireAuth, json } from '@/lib/auth'
import { parseJson } from '@/lib/helpers'
import {
  aiEngineEnabled,
  engineForm,
  persistEngineImage,
  readImageBytes,
} from '@/lib/ai-engine'

export const maxDuration = 180

export async function GET() {
  const user = await getSessionUser()
  const denied = requireAuth(user)

  if (denied) return denied

  const sessions = await db.tryonSession.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })

  return json({ sessions })
}

export async function POST(req: Request) {
  const user = await getSessionUser()
  const denied = requireAuth(user)

  if (denied) return denied

  try {
    const { productId, userPhoto } = await req.json()

    if (!productId) {
      return json({ error: 'Select a product to try on' }, 400)
    }

    if (
      !userPhoto ||
      typeof userPhoto !== 'string' ||
      !userPhoto.startsWith('data:image')
    ) {
      return json({
        error: 'Upload your photo for the virtual fitting room',
      }, 400)
    }

    if (!aiEngineEnabled()) {
      return json({
        error: 'AI Engine is not configured',
      }, 503)
    }

    const product = await db.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return json({ error: 'Product not found' }, 404)
    }

    const productImage = parseJson<string[]>(product.images, [])[0]

    if (!productImage) {
      return json({
        error: 'This product does not have an image',
      }, 400)
    }

    const [person, garment] = await Promise.all([
      readImageBytes(userPhoto),
      readImageBytes(productImage),
    ])

    if (!person || !garment) {
      return json({
        error: 'Unable to read customer or product image',
      }, 400)
    }

    const form = new FormData()

    form.append(
      'person_image',
      new Blob([new Uint8Array(person.bytes)], {
        type: person.mime,
      }),
      'person.png'
    )

    form.append(
      'garment_image',
      new Blob([new Uint8Array(garment.bytes)], {
        type: garment.mime,
      }),
      'garment.png'
    )

    form.append('description', product.name.slice(0, 120))
    form.append('user_id', user!.id)

    let resultUrl: string

    try {
      const output = await engineForm<{ result_url: string }>(
        '/api/v1/tryon',
        form,
        170_000
      )

      if (!output?.result_url) {
        throw new Error('AI Engine returned no try-on image')
      }

      resultUrl = await persistEngineImage(
        output.result_url,
        'tryon'
      )
    } catch (error) {
      console.error('AI virtual try-on failed:', error)

      return json({
        error: 'AI virtual try-on failed. Please try again.',
      }, 502)
    }

    const session = await db.tryonSession.create({
      data: {
        userId: user!.id,
        productId: product.id,
        productName: product.name,
        productImage,
        resultImage: resultUrl,
        status: 'COMPLETED',
      },
    })

    return json({ session }, 201)

  } catch (error) {
    console.error('Try-on API error:', error)

    return json({
      error: 'Virtual try-on failed',
    }, 500)
  }
}



// DELETE /api/v1/tryon — clear all try-on sessions for the authenticated customer
export async function DELETE() {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied

  try {
    const result = await db.tryonSession.deleteMany({ where: { userId: user!.id } })
    return json({ ok: true, count: result.count })
  } catch (e) {
    console.error('tryon DELETE all error', e)
    return json({ error: 'Failed to clear try-on history' }, 500)
  }
}
