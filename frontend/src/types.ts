// Shared client-side types (mirror of Prisma models with parsed JSON fields)

export type Role = 'CUSTOMER' | 'SELLER' | 'DESIGNER' | 'ADMIN'

export interface User {
  id: string
  name: string
  email: string
  phone: string | null
  role: Role
  profileImage: string | null
  avatarColor: string
  city: string | null
  isVerified: boolean
  isActive?: boolean
  createdAt?: string
}

export interface Seller {
  id: string
  userId: string
  shopName: string
  description: string
  contactNumber: string | null
  whatsappNumber: string | null
  shopImage: string | null
  address: string
  city: string
  lat: number
  lng: number
  services: string[]
  specialization: string
  experienceYears: number
  rating: number
  ratingCount: number
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'
  availability: string
  user?: User
  productCount?: number
  distanceKm?: number
}

export interface Designer {
  id: string
  userId: string
  title: string
  bio: string
  specialty: string
  city: string
  lat: number
  lng: number
  experienceYears: number
  rating: number
  ratingCount: number
  portfolioImage: string | null
  user?: User
}

export interface Product {
  id: string
  name: string
  description: string
  fabric: string
  images: string[]
  colors: string[]
  sizes: string[]
  price: number
  stitchingPrice: number | null
  customizationAvailable: boolean
  deliveryDays: number
  stock: number
  status: string
  isFeatured: boolean
  rating: number
  ratingCount: number
  soldCount: number
  tags: string[]
  categoryId: string
  category?: { id: string; name: string; slug: string; icon: string }
  seller: Seller
  createdAt: string
}

export interface CartItem {
  id: string
  productId: string
  product: Product
  size: string
  color: string
  quantity: number
  note: string
  withStitching: boolean
}

export interface OrderItem {
  id: string
  productId: string | null
  name: string
  image: string
  price: number
  size: string
  color: string
  quantity: number
  withStitching: boolean
  customization: string
}

// export interface Order {
//   id: string
//   orderNumber: string
//   status: string
//   totalAmount: number
//   commission: number
//   sellerEarning: number
//   paymentStatus: string
//   paymentMethod: string
//   deliveryDate: string | null
//   address: string
//   notes: string
//   createdAt: string
//   updatedAt: string
//   items: OrderItem[]
//   customer?: User
//   seller?: Seller
// }

export interface BodyProfile {
  height: number | null
  weight: number | null
  chest: number | null
  waist: number | null
  hip: number | null
  shoulder: number | null
  sleeveLength: number | null
  unit: string
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  content: string
  type: 'TEXT' | 'PRODUCT' | 'ORDER' | 'IMAGE'
  refId?: string | null
  createdAt: string
  sender?: { id: string; name: string; role: string; avatarColor: string }
}

export interface Conversation {
  id: string
  customerId: string
  sellerId: string
  lastMessage: string
  lastMessageAt: string
  customer?: User
  seller?: Seller
  unread?: number
}

export interface Review {
  id: string
  rating: number
  comment: string
  createdAt: string
  customer: User
  product?: { id: string; name: string } | null
}

export interface Design {
  id: string
  title: string
  prompt: string
  category: string
  colors: string[]
  fabric: string
  imageUrl: string
  status: string
  createdAt: string
}

export interface TryonSession {
  id: string
  productName: string
  productImage: string
  resultImage: string
  status: string
  createdAt: string
}

export interface Notification {
  id: string
  title: string
  body: string
  type: string
  isRead: boolean
  createdAt: string
}

export interface AdminStats {
  totalUsers: number
  totalSellers: number
  pendingVerifications: number
  totalProducts: number
  totalOrders: number
  activeOrders: number
  totalRevenue: number
  totalCommission: number
  aiDesigns: number
  tryonSessions: number
  recentOrders: Order[]
  sellers: Seller[]
  users: User[]
  categoryBreakdown: { name: string; count: number }[]
}

// Category as returned by GET /api/v1/categories
export interface Category {
  id: string
  name: string
  slug: string
  icon: string
  description: string
  productCount?: number
}


export interface PaymentTransaction {
  id: string
  razorpayOrderId?: string | null
  razorpayPaymentId?: string | null
  kind: 'ADVANCE' | 'FINAL'
  amount: number
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
  method?: string | null
  failureReason?: string | null
  createdAt: string
  verifiedAt?: string | null
}

export interface OrderMeasurement {
  unit: string
  height?: number | null
  weight?: number | null
  chest?: number | null
  waist?: number | null
  hip?: number | null
  shoulder?: number | null
  sleeveLength?: number | null
  neck?: number | null
  armhole?: number | null
  inseam?: number | null
  outseam?: number | null
}

export interface OrderDesign {
  designId?: string | null
  productId?: string | null
  title: string
  imageUrl: string
  category?: string | null
  fabric?: string | null
  color?: string | null
  customization?: string | null
}

export interface ProductionTimeline {
  startDate?: string | null
  estimatedCompletion?: string | null
  expectedDispatch?: string | null
}

export interface CustomerAddress {
  id: string
  fullName: string
  phone: string
  line1: string
  line2?: string | null
  landmark?: string | null
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

// EXTEND the existing Order interface — add these fields:
// advanceAmount, advancePaid, remainingAmount, advanceStatus, finalStatus,
// idempotencyKey, deliveryAddressJson, measurements?, design?, payments[], timeline?

export interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  commission: number
  sellerEarning: number
  paymentStatus: string
  paymentMethod: string
  advanceAmount: number       // NEW
  advancePaid: number         // NEW
  remainingAmount: number     // NEW
  advanceStatus: string       // NEW: UNPAID | PAID
  finalStatus: string         // NEW: UNPAID | PAID
  deliveryDate: string | null
  address: string
  notes: string
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  customer?: User
  seller?: Seller
  measurements?: OrderMeasurement | null  // NEW
  design?: OrderDesign | null              // NEW
  payments?: PaymentTransaction[]          // NEW
  timeline?: ProductionTimeline | null     // NEW
}
