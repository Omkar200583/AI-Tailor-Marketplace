import { getSessionUser, requireAuth, json } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'
import { randomUUID } from 'node:crypto'

export const runtime = 'nodejs'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024
const MAX_FILES = 8

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

async function uploadToCloudinary(buffer: Buffer, filename: string) {
  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'ai-tailor/products',
        public_id: filename,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error)
          return
        }

        if (!result?.secure_url) {
          reject(new Error('Cloudinary did not return an image URL'))
          return
        }

        resolve(result.secure_url)
      },
    )

    stream.end(buffer)
  })
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser()

    const denied = requireAuth(user, [
      'CUSTOMER',
      'SELLER',
      'DESIGNER',
      'ADMIN',
    ])

    if (denied) return denied

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return json(
        { error: 'Cloudinary configuration is missing' },
        500,
      )
    }

    const formData = await req.formData()

    const files = formData
      .getAll('files')
      .filter(
        (file): file is File =>
          file instanceof File && file.size > 0,
      )

    if (files.length === 0) {
      return json({ error: 'No files provided' }, 400)
    }

    if (files.length > MAX_FILES) {
      return json(
        { error: `Maximum ${MAX_FILES} files allowed` },
        400,
      )
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return json(
          { error: `Unsupported image type: ${file.type}` },
          400,
        )
      }

      if (file.size > MAX_SIZE) {
        return json(
          { error: `${file.name} exceeds the 5 MB limit` },
          400,
        )
      }
    }

    const urls = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer())
        return uploadToCloudinary(buffer, randomUUID())
      }),
    )

    return json({ urls }, 201)
  } catch (error) {
    console.error('[UPLOAD API ERROR]', error)

    const details =
      error instanceof Error
        ? error.message
        : 'Unknown upload error'

    return json(
      {
        error: 'Failed to upload images',
        details,
      },
      500,
    )
  }
}
