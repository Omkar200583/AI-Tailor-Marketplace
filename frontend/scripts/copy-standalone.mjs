import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const staticSource = path.join(root, '.next', 'static')
const staticDestination = path.join(
  root,
  '.next',
  'standalone',
  '.next',
  'static'
)

const publicSource = path.join(root, 'public')
const publicDestination = path.join(
  root,
  '.next',
  'standalone',
  'public'
)

if (!fs.existsSync(path.join(root, '.next', 'standalone'))) {
  throw new Error(
    'Standalone output not found. Check output: standalone in next.config.ts'
  )
}

if (fs.existsSync(staticSource)) {
  fs.mkdirSync(staticDestination, { recursive: true })
  fs.cpSync(staticSource, staticDestination, { recursive: true })
  console.log('Static assets copied successfully.')
}

if (fs.existsSync(publicSource)) {
  fs.cpSync(publicSource, publicDestination, { recursive: true })
  console.log('Public assets copied successfully.')
}

console.log('Standalone build preparation completed.')
