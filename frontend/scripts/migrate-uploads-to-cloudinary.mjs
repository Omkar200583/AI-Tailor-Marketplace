import { PrismaClient } from '@prisma/client'
import { v2 as cloudinary } from 'cloudinary'
import fs from 'node:fs'
import path from 'node:path'

const prisma = new PrismaClient()
const root = process.cwd()
const uploadsDir = path.join(root, 'public', 'uploads')
const apply = process.argv.includes('--apply')

for (const name of ['.env', '.env.local']) {
  const file = path.join(root, name)
  if (fs.existsSync(file)) process.loadEnvFile(file)
}

const required = [
  'DATABASE_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
]

for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing ${key}`)
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const plans = []
const missing = new Set()
const files = new Set()
const failures = []

function filenameFrom(value) {
  if (typeof value !== 'string' || !value.trim()) return null

  try {
    const pathname = decodeURIComponent(
      new URL(value, 'http://localhost').pathname
    )

    if (!pathname.includes('/uploads/')) return null

    return path.basename(pathname)
  } catch {
    return null
  }
}

async function scanScalar(modelName, field) {
  const records = await prisma[modelName].findMany({
    select: { id: true, [field]: true },
  })

  for (const record of records) {
    const oldValue = record[field]
    const filename = filenameFrom(oldValue)

    if (!filename) continue

    files.add(filename)

    plans.push({
      modelName,
      id: record.id,
      field,
      oldValue,
      filename,
      kind: 'scalar',
    })
  }
}

async function scanArray(modelName, field) {
  const records = await prisma[modelName].findMany({
    select: { id: true, [field]: true },
  })

  for (const record of records) {
    const oldValue = record[field]

    if (typeof oldValue !== 'string' || !oldValue.trim()) continue

    let values

    try {
      values = JSON.parse(oldValue)
    } catch {
      failures.push(`${modelName}.${field} ${record.id}: Invalid JSON`)
      continue
    }

    if (!Array.isArray(values)) continue

    const replacements = values.map(value => {
      const filename = filenameFrom(value)

      if (!filename) return value

      files.add(filename)

      plans.push({
        modelName,
        id: record.id,
        field,
        oldValue,
        filename,
        kind: 'array',
      })

      return { __migrationFilename: filename }
    })

    const changed = replacements.some(
      value => value && typeof value === 'object' &&
        '__migrationFilename' in value
    )

    if (changed) {
      const plan = plans.filter(
        item => item.modelName === modelName &&
          item.id === record.id &&
          item.field === field
      )

      plan[plan.length - 1].arrayValues = replacements
    }
  }
}

async function main() {
  console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN'}`)

  await scanArray('product', 'images')
  await scanScalar('orderItem', 'image')

  for (const filename of files) {
    if (!fs.existsSync(path.join(uploadsDir, filename))) {
      missing.add(filename)
    }
  }

  console.log('\n========== MIGRATION PLAN ==========')

  for (const plan of plans) {
    console.log(
      `${plan.modelName}.${plan.field} | ${plan.id} | ${plan.filename}`
    )
  }

  console.log('\nUnique files:', files.size)
  console.log('Database records:', plans.length)
  console.log('Missing files:', missing.size)
  console.log('Failures:', failures.length)

  if (missing.size || failures.length) {
    throw new Error('Pre-migration validation failed. No changes made.')
  }

  const backupPath = path.join(
    root,
    `image-migration-backup-${Date.now()}.json`
  )

  fs.writeFileSync(
    backupPath,
    JSON.stringify(plans, null, 2),
    'utf8'
  )

  console.log('\nBackup:', backupPath)

  if (!apply) {
    console.log('\nDRY RUN COMPLETE. No uploads or database changes.')
    return
  }

  const urlMap = new Map()

  for (const filename of files) {
    const localPath = path.join(uploadsDir, filename)
    const publicId = path.parse(filename).name

    const result = await cloudinary.uploader.upload(localPath, {
      folder: 'ai-tailor/migrated',
      public_id: publicId,
      resource_type: 'image',
      overwrite: true,
    })

    urlMap.set(filename, result.secure_url)
    console.log('Uploaded:', filename)
  }

  for (const plan of plans) {
    let newValue

    if (plan.kind === 'scalar') {
      newValue = urlMap.get(plan.filename)
    } else {
      const values = plan.arrayValues.map(value => {
        if (
          value &&
          typeof value === 'object' &&
          '__migrationFilename' in value
        ) {
          return urlMap.get(value.__migrationFilename)
        }

        return value
      })

      newValue = JSON.stringify(values)
    }

    const result = await prisma[plan.modelName].updateMany({
      where: {
        id: plan.id,
        [plan.field]: plan.oldValue,
      },
      data: {
        [plan.field]: newValue,
      },
    })

    if (result.count !== 1) {
      throw new Error(
        `Database update conflict: ${plan.modelName}.${plan.field} ${plan.id}`
      )
    }

    console.log('Updated:', plan.modelName, plan.id)
  }

  const reportPath = path.join(
    root,
    `image-migration-success-${Date.now()}.json`
  )

  fs.writeFileSync(
    reportPath,
    JSON.stringify({
      completedAt: new Date().toISOString(),
      uploadedFiles: Object.fromEntries(urlMap),
      updatedRecords: plans.length,
      backupPath,
    }, null, 2),
    'utf8'
  )

  console.log('\n========== MIGRATION COMPLETE ==========')
  console.log('Uploaded images:', urlMap.size)
  console.log('Updated records:', plans.length)
  console.log('Report:', reportPath)
}

main()
  .catch(error => {
    console.error('\nMIGRATION ERROR:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
