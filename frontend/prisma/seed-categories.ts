// Seed script: populates the Category table with sensible defaults
// for a tailoring / fashion marketplace.
//
// Run with:
//   npx tsx prisma/seed-categories.ts
//
// Safe to re-run: existing categories are skipped (matched by slug).
//
// NOTE: the live Prisma `Category` model has only:
//   id, name, slug, icon, description, sortOrder, products
// It does NOT have `isActive` or `gender` columns — do not pass them.

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const slugify = (v: string) =>
  v.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const SEED_CATEGORIES: { name: string; icon?: string; description?: string }[] = [
  // Men
  { name: "Men's Wear", icon: '👔', description: "Men's shirts, kurtas, suits and ethnic wear" },
  { name: 'Shirt', icon: '👔', description: "Men's shirts — formal, casual, custom tailored" },
  { name: 'Kurta', icon: '🧥', description: "Men's kurtas and ethnic wear" },
  { name: 'Sherwani', icon: '🤵', description: "Men's wedding sherwanis" },
  { name: 'Suit', icon: '🤵', description: "Men's suits and blazers" },
  { name: 'Trousers', icon: '👖', description: "Men's trousers and pants" },
  { name: 'Blazer', icon: '🧥', description: "Men's blazers and jackets" },

  // Women
  { name: "Women's Wear", icon: '👗', description: "Women's sarees, lehengas, kurtis and gowns" },
  { name: 'Saree', icon: '🥻', description: "Women's sarees with custom blouse stitching" },
  { name: 'Lehenga', icon: '💃', description: "Women's lehengas and bridal wear" },
  { name: 'Kurti', icon: '👚', description: "Women's kurtis and tunics" },
  { name: 'Gown', icon: '👗', description: "Women's gowns and evening wear" },
  { name: 'Salwar Suit', icon: '👚', description: "Women's salwar suits" },
  { name: 'Blouse', icon: '👚', description: "Women's blouses — custom stitched to measurements" },

  // Kids
  { name: 'Kids Wear', icon: '🧸', description: 'Clothing for children' },

  // Unisex / general
  { name: 'Jeans', icon: '👖', description: 'Jeans and denim wear' },
  { name: 'Dress', icon: '👗', description: 'Dresses — casual, formal, party' },
  { name: 'Alterations', icon: '✂️', description: 'Alteration and repair services' },
  { name: 'Bridal Wear', icon: '👰', description: 'Bridal lehengas, gowns, and trousseau' },
  { name: 'Accessories', icon: '🎀', description: 'Stoles, dupattas, ties, and accessories' },
]

async function main() {
  let created = 0
  let skipped = 0

  for (let i = 0; i < SEED_CATEGORIES.length; i++) {
    const c = SEED_CATEGORIES[i]
    const slug = slugify(c.name)
    const existing = await prisma.category.findUnique({ where: { slug } })
    if (existing) {
      skipped++
      continue
    }
    await prisma.category.create({
      data: {
        name: c.name,
        slug,
      icon: c.icon || undefined,
description: c.description || undefined,
        sortOrder: i,
      },
    })
    created++
  }

  console.log(`✅ Seed complete — ${created} created, ${skipped} already existed.`)
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

