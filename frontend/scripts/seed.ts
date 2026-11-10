// AI Tailor — Database Seed Script (run: bun scripts/seed.ts)
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const db = new PrismaClient()

const imgs = JSON.parse(fs.readFileSync('/home/z/my-project/scripts/imgs/urls.json', 'utf8')) as Record<string, string[]>
const take = (key: string, n: number) => imgs[key].slice(0, n)

async function main() {
  console.log('Clearing old data...')
  await db.commissionLog.deleteMany()
  await db.notification.deleteMany()
  await db.message.deleteMany()
  await db.conversation.deleteMany()
  await db.tryonSession.deleteMany()
  await db.design.deleteMany()
  await db.review.deleteMany()
  await db.orderItem.deleteMany()
  await db.order.deleteMany()
  await db.cartItem.deleteMany()
  await db.wishlistItem.deleteMany()
  await db.bodyProfile.deleteMany()
  await db.product.deleteMany()
  await db.category.deleteMany()
  await db.designerProfile.deleteMany()
  await db.sellerProfile.deleteMany()
  await db.user.deleteMany()

  const { scryptSync, randomBytes } = await import('crypto')
  const hash = (pw: string) => {
    const salt = randomBytes(16).toString('hex')
    return `${salt}:${scryptSync(pw, salt, 32).toString('hex')}`
  }

  console.log('Creating categories...')
  const categories = await Promise.all(
    [
      { name: 'Kurta Sets', slug: 'kurta-sets', icon: '🧵', description: 'Classic & festive menswear kurtas with custom stitching', sortOrder: 1 },
      { name: 'Sarees', slug: 'sarees', icon: '🥻', description: 'Silk, banarasi & designer sarees with blouse stitching', sortOrder: 2 },
      { name: 'Lehengas', slug: 'lehengas', icon: '👗', description: 'Bridal & party lehenga cholis, fully customizable', sortOrder: 3 },
      { name: 'Sherwani', slug: 'sherwani', icon: '🤵', description: 'Royal wedding sherwanis with embroidery & accessories', sortOrder: 4 },
      { name: 'Kurti & Suits', slug: 'kurti-suits', icon: '👚', description: 'Everyday & office kurtis, salwar suits and more', sortOrder: 5 },
      { name: 'Kids Wear', slug: 'kids', icon: '🧒', description: 'Festive ethnic wear for little stars', sortOrder: 6 },
      { name: 'Blouses', slug: 'blouses', icon: '✨', description: 'Designer readymade & stitched blouses', sortOrder: 7 },
    ].map((c) => db.category.create({ data: c }))
  )
  const cat = (slug: string) => categories.find((c) => c.slug === slug)!

  console.log('Creating users...')
  const admin = await db.user.create({ data: { name: 'Platform Admin', email: 'admin@aitailor.in', phone: '+91 98000 00001', passwordHash: hash('admin123'), role: 'ADMIN', avatarColor: '#1F2937', city: 'Pune', isVerified: true } })
  const customer = await db.user.create({ data: { name: 'Priya Sharma', email: 'customer@aitailor.in', phone: '+91 98000 00002', passwordHash: hash('customer123'), role: 'CUSTOMER', avatarColor: '#7C2D3E', city: 'Pune', isVerified: true } })
  const customer2 = await db.user.create({ data: { name: 'Rohit Patil', email: 'rohit@aitailor.in', phone: '+91 98000 00003', passwordHash: hash('customer123'), role: 'CUSTOMER', avatarColor: '#B45309', city: 'Pune', isVerified: true } })

  const sellerUsers = await Promise.all([
    db.user.create({ data: { name: 'Sai Deshmukh', email: 'seller@aitailor.in', phone: '+91 98220 11223', passwordHash: hash('seller123'), role: 'SELLER', avatarColor: '#166534', city: 'Pune', isVerified: true } }),
    db.user.create({ data: { name: 'Balaji Shinde', email: 'balaji@aitailor.in', phone: '+91 98220 11224', passwordHash: hash('seller123'), role: 'SELLER', avatarColor: '#0F766E', city: 'Pune', isVerified: true } }),
    db.user.create({ data: { name: 'Aarav Kulkarni', email: 'aarav@aitailor.in', phone: '+91 98220 11225', passwordHash: hash('seller123'), role: 'SELLER', avatarColor: '#7E22CE', city: 'Pune', isVerified: true } }),
    db.user.create({ data: { name: 'Sunita Joshi', email: 'sunita@aitailor.in', phone: '+91 98220 11226', passwordHash: hash('seller123'), role: 'SELLER', avatarColor: '#BE123C', city: 'Pune', isVerified: false } }),
  ])

  const designerUsers = await Promise.all([
    db.user.create({ data: { name: 'Meera Kulkarni', email: 'meera@aitailor.in', phone: '+91 98220 33445', passwordHash: hash('designer123'), role: 'DESIGNER', avatarColor: '#9D174D', city: 'Pune', isVerified: true } }),
    db.user.create({ data: { name: 'Rahul Verma', email: 'rahul@aitailor.in', phone: '+91 98220 33446', passwordHash: hash('designer123'), role: 'DESIGNER', avatarColor: '#4338CA', city: 'Pune', isVerified: true } }),
  ])

  console.log('Creating seller profiles...')
  const sellers = await Promise.all([
    db.sellerProfile.create({
      data: {
        userId: sellerUsers[0].id, shopName: 'Sai Fashion Tailors', city: 'Pune',
        description: 'Pune\'s most loved family tailor since 1998. Bridal, wedding & festive custom tailoring with perfect fitting guaranteed.',
        contactNumber: '+91 98220 11223', whatsappNumber: '919822011223',
        address: 'Shop 12, Laxmi Road, Sadashiv Peth', lat: 18.5162, lng: 73.8530,
        services: JSON.stringify(['Bridal Wear', 'Wedding Kurtas', 'Custom Blouse', 'Alterations', 'Express Stitching']),
        specialization: 'Bridal & Wedding Wear', experienceYears: 24,
        verificationStatus: 'VERIFIED', availability: 'Mon-Sat, 9AM-9PM',
        shopImage: take('tailorshop', 1)[0],
      },
    }),
    db.sellerProfile.create({
      data: {
        userId: sellerUsers[1].id, shopName: 'Shree Balaji Stitching House', city: 'Pune',
        description: 'Traditional ethnic wear specialists. Bulk & single orders, hand embroidery, zari work and premium finishing.',
        contactNumber: '+91 98220 11224', whatsappNumber: '919822011224',
        address: 'Near Kothrud Bus Depot, Paud Road', lat: 18.5074, lng: 73.8077,
        services: JSON.stringify(['Sherwani Stitching', 'Zari Embroidery', 'Saree Falling', 'Bulk Orders']),
        specialization: 'Ethnic & Traditional Wear', experienceYears: 18,
        verificationStatus: 'VERIFIED', availability: 'Mon-Sun, 10AM-8PM',
        shopImage: take('tailorshop', 2)[1],
      },
    }),
    db.sellerProfile.create({
      data: {
        userId: sellerUsers[2].id, shopName: 'Urban Stitch Studio', city: 'Pune',
        description: 'Modern fusion tailoring for the young crowd — Indo-western, bandhgalas, designer shirts & perfect-fit trousers.',
        contactNumber: '+91 98220 11225', whatsappNumber: '919822011225',
        address: 'Lane 6, Baner Main Road', lat: 18.5590, lng: 73.7868,
        services: JSON.stringify(['Indo-Western', 'Designer Shirts', 'Bandhgala', 'Express Delivery']),
        specialization: 'Modern & Fusion Wear', experienceYears: 9,
        verificationStatus: 'VERIFIED', availability: 'Tue-Sun, 11AM-9PM',
        shopImage: take('tailorshop', 3)[2],
      },
    }),
    db.sellerProfile.create({
      data: {
        userId: sellerUsers[3].id, shopName: 'Aai Creations Boutique', city: 'Pune',
        description: 'Women\'s ethnic boutique — kurtis, saree blouses, lehenga cholis stitched with love by Aai.',
        contactNumber: '+91 98220 11226', whatsappNumber: '919822011226',
        address: 'Karve Nagar Main Road', lat: 18.4890, lng: 73.8230,
        services: JSON.stringify(['Lehenga Choli', 'Custom Kurti', 'Blouse Stitching']),
        specialization: "Women's Ethnic Wear", experienceYears: 12,
        verificationStatus: 'PENDING', availability: 'Mon-Sat, 10AM-7PM',
        shopImage: take('tailorshop', 4)[3],
      },
    }),
  ])

  console.log('Creating designer profiles...')
  await Promise.all([
    db.designerProfile.create({
      data: {
        userId: designerUsers[0].id, title: 'Bridal Couture Designer', specialty: 'Bridal Lehengas & Gowns',
        bio: 'National Award winning designer with 14 years of bridal couture experience. Famous for Maharashtrian nawari & modern fusion bridal looks.',
        experienceYears: 14, rating: 4.9, ratingCount: 87, city: 'Pune', lat: 18.5270, lng: 73.8460,
        portfolioImage: take('lehenga', 1)[0],
      },
    }),
    db.designerProfile.create({
      data: {
        userId: designerUsers[1].id, title: 'Menswear Designer', specialty: 'Fusion Menswear & Bandhgalas',
        bio: 'Ex-Sabyasachi studio designer. Modern silhouettes, Indo-western cuts and royal bandhgalas for grooms.',
        experienceYears: 11, rating: 4.8, ratingCount: 64, city: 'Pune', lat: 18.5620, lng: 73.9100,
        portfolioImage: take('sherwani', 1)[0],
      },
    }),
  ])

  console.log('Creating products...')
  const P = (
    sellerIdx: number, catSlug: string, name: string, description: string, fabric: string,
    price: number, stitchingPrice: number | null, images: string[], colors: string[], sizes: string[],
    opts: { featured?: boolean; sold?: number; rating?: number; ratingCount?: number; tags?: string[]; deliveryDays?: number } = {}
  ) =>
    db.product.create({
      data: {
        sellerId: sellers[sellerIdx].id, categoryId: cat(catSlug).id,
        name, description, fabric, price, stitchingPrice,
        images: JSON.stringify(images), colors: JSON.stringify(colors), sizes: JSON.stringify(sizes),
        isFeatured: !!opts.featured, soldCount: opts.sold || 0,
        rating: opts.rating || 0, ratingCount: opts.ratingCount || 0,
        tags: JSON.stringify(opts.tags || []),
        deliveryDays: opts.deliveryDays || 7,
      },
    })

  const products = await Promise.all([
    // Mens kurta
    P(0, 'kurta-sets', 'Royal Black Wedding Kurta with Golden Embroidery', 'Hand-embroidered black silk kurta with golden zari motifs, mandarin collar and traditional Indian patterns. Perfect for weddings & receptions.', 'Bangalore Silk', 2899, 599, take('kurta', 2), ['Black', 'Gold'], ['S', 'M', 'L', 'XL', 'XXL'], { featured: true, sold: 132, rating: 4.8, ratingCount: 64, tags: ['wedding', 'embroidery'] }),
    P(0, 'kurta-sets', 'Ivory Chikankari Kurta Set', 'Lucknowi chikankari hand-embroidered ivory kurta with churidar. Breathable, elegant and timeless.', 'Cotton Silk', 2199, 549, take('kurta', 3).slice(1), ['Ivory', 'White'], ['S', 'M', 'L', 'XL'], { sold: 88, rating: 4.6, ratingCount: 41, tags: ['festive'] }),
    P(1, 'kurta-sets', 'Saffron Festive Kurta with Dhoti', 'Bright saffron cotton-silk kurta paired with ready dhoti. Ideal for haldi, pujas and festivals.', 'Cotton Silk', 1499, 449, take('kurta', 4).slice(2), ['Saffron', 'Marigold'], ['M', 'L', 'XL'], { sold: 210, rating: 4.5, ratingCount: 92, tags: ['haldi', 'festive'] }),
    // Sarees
    P(3, 'sarees', 'Kanjivaram Silk Saree — Deep Maroon', 'Pure Kanjivaram silk with temple border and rich pallu. Includes fall, pico and blouse stitching service.', 'Kanjivaram Silk', 5499, 899, take('saree', 2), ['Maroon', 'Red'], ['Free Size'], { featured: true, sold: 76, rating: 4.9, ratingCount: 53, tags: ['bridal', 'silk'], deliveryDays: 9 }),
    P(3, 'sarees', 'Banarasi Georgette Saree — Royal Blue', 'Lightweight banarasi georgette with silver zari butis. Draping + stitched blouse available.', 'Banarasi Georgette', 3299, 749, take('saree', 3).slice(1), ['Royal Blue', 'Silver'], ['Free Size'], { sold: 143, rating: 4.7, ratingCount: 77, tags: ['party'] }),
    P(1, 'sarees', 'Chanderi Cotton Saree — Pastel Mint', 'Handloom chanderi with golden motifs. Summer-friendly and office perfect.', 'Chanderi Cotton', 2299, 699, take('saree', 4).slice(2), ['Mint', 'Pastel Green'], ['Free Size'], { sold: 54, rating: 4.4, ratingCount: 28, tags: ['office'] }),
    // Lehengas
    P(0, 'lehengas', 'Bridal Red Velvet Lehenga with Zardosi', 'Show-stopping bridal lehenga in deep red velvet with hand zardosi work, 12-panel flare and canvas lining.', 'Velvet & Net', 24999, 1999, take('lehenga', 2), ['Red', 'Maroon'], ['S', 'M', 'L'], { featured: true, sold: 23, rating: 5.0, ratingCount: 19, tags: ['bridal', 'luxury'], deliveryDays: 14 }),
    P(3, 'lehengas', 'Rani Pink Party Lehenga with Sequins', 'Flowy rani-pink lehenga with sequin work and dupatta. Custom fitting with your body measurements.', 'Net & Satin', 11499, 1299, take('lehenga', 3).slice(1), ['Rani Pink', 'Pink'], ['XS', 'S', 'M', 'L', 'XL'], { sold: 47, rating: 4.7, ratingCount: 33, tags: ['sangeet'], deliveryDays: 12 }),
    // Sherwani
    P(1, 'sherwani', 'Ivory Raw Silk Sherwani with Zardozi', 'Regal ivory raw-silk sherwani with zardozi handwork, churidar and matching stole.', 'Raw Silk', 15999, 1499, take('sherwani', 2), ['Ivory', 'Cream'], ['M', 'L', 'XL'], { featured: true, sold: 31, rating: 4.9, ratingCount: 26, tags: ['groom', 'wedding'], deliveryDays: 14 }),
    P(1, 'sherwani', 'Navy Jodhpuri Bandhgala Set', 'Jodhpuri bandhgala in deep navy with brass buttons and breeches. Sleek, royal, modern.', 'Terry Rayon Silk', 8999, 999, take('sherwani', 3).slice(1), ['Navy Blue', 'Midnight'], ['S', 'M', 'L', 'XL'], { sold: 42, rating: 4.6, ratingCount: 24, tags: ['reception'] }),
    // Kurti & suits
    P(3, 'kurti-suits', 'A-line Cotton Kurti — Block Print', 'Everyday A-line kurti with jaipuri block prints, side pockets and breathable cotton.', 'Cotton', 899, 349, take('kurti', 2), ['Indigo', 'White'], ['S', 'M', 'L', 'XL'], { sold: 320, rating: 4.5, ratingCount: 121, tags: ['daily'] }),
    P(3, 'kurti-suits', 'Chanderi Silk Palazzo Suit Set', 'Elegant chanderi kurti with palazzo and organza dupatta. Office to festive in one outfit.', 'Chanderi Silk', 1899, 599, take('kurti', 3).slice(1), ['Wine', 'Gold'], ['S', 'M', 'L', 'XL', 'XXL'], { featured: true, sold: 95, rating: 4.7, ratingCount: 49, tags: ['office', 'festive'] }),
    // Kids
    P(1, 'kids', 'Kids Festive Kurta Pyjama — Mustard', 'Adorable mustard silk kurta pyjama for boys with resham thread work. Soft lining, zero itch.', 'Art Silk', 1199, 299, take('kids', 2), ['Mustard', 'Yellow'], ['2-3Y', '4-5Y', '6-7Y', '8-9Y'], { sold: 178, rating: 4.8, ratingCount: 66, tags: ['festive'] }),
    P(3, 'kids', 'Kids Lehenga Choli — Peach Shimmer', 'Twirl-worthy peach lehenga choli for girls with shimmer dupatta and elastic comfort waist.', 'Shimmer Net', 1699, 399, take('kids', 3).slice(1), ['Peach', 'Gold'], ['2-3Y', '4-5Y', '6-7Y'], { sold: 88, rating: 4.6, ratingCount: 37, tags: ['birthday'] }),
    // Blouses
    P(3, 'blouses', 'Designer Zari Embroidered Blouse', 'Deep-back designer blouse with zari hand embroidery. Stitched to your exact measurements.', 'Raw Silk', 1299, 249, take('blouse', 2), ['Gold', 'Maroon'], ['30', '32', '34', '36', '38', '40'], { sold: 156, rating: 4.7, ratingCount: 71, tags: ['saree'] }),
    P(0, 'blouses', 'Sleeveless Velvet Party Blouse', 'Luxurious velvet blouse with sheer mesh sleeves option. Matches silk sarees beautifully.', 'Velvet', 1099, 249, take('blouse', 3).slice(1), ['Wine', 'Black'], ['32', '34', '36', '38', '40'], { sold: 61, rating: 4.3, ratingCount: 22, tags: ['party'] }),
  ])

  console.log('Creating reviews...')
  const reviewData = [
    { customer: customer, sellerIdx: 0, productIdx: 0, rating: 5, comment: 'Perfect fitting! The golden embroidery on my wedding kurta was even better than the photo. Sai sir is the best tailor in Pune.' },
    { customer: customer2, sellerIdx: 0, productIdx: 0, rating: 5, comment: 'Delivered 2 days early. Fabric quality is premium. Highly recommended for wedding shopping.' },
    { customer: customer, sellerIdx: 0, productIdx: null, rating: 4, comment: 'Great shop on Laxmi Road. Small delay but the fitting was spot on.' },
    { customer: customer2, sellerIdx: 1, productIdx: 8, rating: 5, comment: 'My sherwani fit like it was made by royal tailors. Zardozi work is exquisite!' },
    { customer: customer, sellerIdx: 3, productIdx: 10, rating: 5, comment: 'Block print kurti is my daily favourite now. Aai Creations never disappoints.' },
    { customer: customer2, sellerIdx: 2, productIdx: null, rating: 4, comment: 'Urban Stitch made me a bandhgala that got compliments all evening.' },
  ]
  for (const r of reviewData) {
    await db.review.create({
      data: {
        customerId: r.customer.id, sellerId: sellers[r.sellerIdx].id,
        productId: r.productIdx !== null ? products[r.productIdx].id : null,
        rating: r.rating, comment: r.comment,
      },
    })
  }

  // Aggregate seller rating counts
  for (const s of sellers) {
    const sReviews = reviewData.filter((r) => sellers[r.sellerIdx].id === s.id)
    if (sReviews.length === 0) continue
    const avg = sReviews.reduce((a, r) => a + r.rating, 0) / sReviews.length
    await db.sellerProfile.update({ where: { id: s.id }, data: { rating: Math.round(avg * 10) / 10, ratingCount: sReviews.length } })
  }

  console.log('Creating demo orders...')
  const order1 = await db.order.create({
    data: {
      orderNumber: 'AIT-1001', customerId: customer.id, sellerId: sellers[0].id,
      status: 'IN_PRODUCTION', totalAmount: 3498, commission: 175, sellerEarning: 3323,
      paymentStatus: 'PAID', paymentMethod: 'upi',
      deliveryDate: new Date(Date.now() + 5 * 86400000),
      address: 'Flat 402, Sunrise Residency, Karve Nagar, Pune 411052',
      notes: 'Please keep the collar slightly stiff.',
      items: {
        create: [{ productId: products[0].id, name: products[0].name, image: take('kurta', 1)[0], price: 3498, size: 'M', color: 'Black', quantity: 1, withStitching: true, customization: 'Sleeve +1 inch' }],
      },
    },
  })
  await db.commissionLog.create({ data: { orderId: order1.id, orderNumber: order1.orderNumber, sellerId: sellers[0].id, amount: 175, rate: 0.05 } })

  const order2 = await db.order.create({
    data: {
      orderNumber: 'AIT-1002', customerId: customer.id, sellerId: sellers[2].id,
      status: 'REQUESTED', totalAmount: 10498, commission: 525, sellerEarning: 9973,
      paymentStatus: 'UNPAID',
      address: 'Flat 402, Sunrise Residency, Karve Nagar, Pune 411052',
      items: {
        create: [{ productId: products[9].id, name: products[9].name, image: take('sherwani', 1)[1], price: 10498, size: 'L', color: 'Navy Blue', quantity: 1, withStitching: true, customization: '' }],
      },
    },
  })
  await db.order.create({
    data: {
      orderNumber: 'AIT-1003', customerId: customer2.id, sellerId: sellers[0].id,
      status: 'COMPLETED', totalAmount: 6398, commission: 320, sellerEarning: 6078,
      paymentStatus: 'PAID', paymentMethod: 'card',
      deliveryDate: new Date(Date.now() - 6 * 86400000),
      address: 'House 7, Shivaji Nagar, Pune 411005',
      items: {
        create: [
          { productId: products[0].id, name: products[0].name, image: take('kurta', 1)[0], price: 2899, size: 'L', color: 'Black', quantity: 1, withStitching: false, customization: '' },
          { productId: products[1].id, name: products[1].name, image: take('kurta', 1)[1], price: 2199, size: 'L', color: 'Ivory', quantity: 1, withStitching: true, customization: '' },
        ],
      },
    },
  })
  await db.commissionLog.create({ data: { orderId: order2.id, orderNumber: order2.orderNumber, sellerId: sellers[0].id, amount: 0, rate: 0.05 } })

  console.log('Creating conversations & messages...')
  const conv1 = await db.conversation.create({ data: { customerId: customer.id, sellerId: sellers[0].id } })
  await db.message.create({ data: { conversationId: conv1.id, senderId: customer.id, content: 'नमस्ते! My wedding is on 24th. Can you stitch the black golden kurta in 10 days?', type: 'TEXT' } })
  await db.message.create({ data: { conversationId: conv1.id, senderId: sellerUsers[0].id, content: 'Namaste Priya ji! 🙏 Yes absolutely — 10 days is comfortable. Please share your body measurements from the app so the fitting is perfect.', type: 'TEXT' } })
  await db.message.create({ data: { conversationId: conv1.id, senderId: customer.id, content: 'Done! I filled them in the Measurements section. Please use chest 38, waist 32.', type: 'TEXT' } })

  const conv2 = await db.conversation.create({ data: { customerId: customer.id, sellerId: sellers[2].id } })
  await db.message.create({ data: { conversationId: conv2.id, senderId: sellerUsers[2].id, content: 'Hi! We received your navy bandhgala order request. We can deliver by next Friday — please approve the final price ₹10,498.', type: 'TEXT' } })

  console.log('Creating body profile, cart, wishlist, notifications...')
  await db.bodyProfile.create({ data: { userId: customer.id, height: 162, weight: 56, chest: 92, waist: 74, hip: 98, shoulder: 39, sleeveLength: 56, unit: 'cm' } })
  await db.cartItem.create({ data: { userId: customer.id, productId: products[6].id, size: 'M', color: 'Rani Pink', quantity: 1, withStitching: true } })
  await db.wishlistItem.create({ data: { userId: customer.id, productId: products[3].id } })
  await db.wishlistItem.create({ data: { userId: customer.id, productId: products[8].id } })

  await db.notification.createMany({
    data: [
      { userId: customer.id, title: 'Order In Production 🧵', body: 'Your Royal Black Wedding Kurta is being stitched by Sai Fashion Tailors.', type: 'ORDER' },
      { userId: customer.id, title: 'Welcome to AI Tailor 🎉', body: 'Try the AI Design Studio — describe your dream outfit and watch it come alive!', type: 'INFO' },
      { userId: sellerUsers[0].id, title: 'New Order Request 🧾', body: 'Order AIT-1001 received. Review and accept to start stitching.', type: 'ORDER' },
      { userId: sellerUsers[2].id, title: 'New Order Request 🧾', body: 'Order AIT-1002 needs your approval.', type: 'ORDER' },
      { userId: admin.id, title: 'Verification Pending ⏳', body: 'Aai Creations Boutique has submitted verification documents.', type: 'INFO' },
    ],
  })

  console.log('✅ Seed complete!')
  console.log('Demo logins: customer@aitailor.in/customer123 · seller@aitailor.in/seller123 · admin@aitailor.in/admin123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
