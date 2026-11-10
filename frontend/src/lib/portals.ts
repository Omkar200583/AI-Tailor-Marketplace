export type Role = 'CUSTOMER' | 'SELLER' | 'DESIGNER' | 'ADMIN'
export type PortalId = 'user' | 'seller' | 'admin'

export const PORTAL_ROLES: Record<PortalId, Role[]> = {
  user: ['CUSTOMER', 'DESIGNER'],
  seller: ['SELLER'],
  admin: ['ADMIN'],
}

export const PORTAL_PATHS: Record<
  PortalId,
  {
    base: string
    login: string
    register: string | null
    dashboard: string
    label: string
  }
> = {
  user: {
    base: '/user',
    login: '/login',
    register: '/register',
    dashboard: '/user/dashboard',
    label: 'Customer',
  },
  seller: {
    base: '/seller',
    login: '/seller/login',
    register: '/seller/register',
    dashboard: '/seller/dashboard',
    label: 'Seller',
  },
  admin: {
    base: '/admin',
    login: '/admin/login',
    register: '/admin/register',
    dashboard: '/admin/dashboard',
    label: 'Admin',
  },
}

export function portalForRole(role: string | null | undefined): PortalId {
  if (role === 'SELLER') return 'seller'
  if (role === 'ADMIN') return 'admin'
  return 'user'
}

export function roleAllowedInPortal(role: string | null | undefined, portal: PortalId): boolean {
  return !!role && PORTAL_ROLES[portal].includes(role as Role)
}

export function dashboardPathForRole(role: string | null | undefined): string {
  return PORTAL_PATHS[portalForRole(role)].dashboard
}

export const CUSTOMER_TAB_PATH: Record<string, string> = {
  overview: '/user/dashboard',
  orders: '/user/orders',
  cart: '/user/cart',
  measurements: '/user/measurements',
  wishlist: '/user/wishlist',
  designs: '/user/designs',
  tryon: '/user/try-on-history',
  messages: '/user/chat',
  notifications: '/user/notifications',
  settings: '/user/settings',
}

export const SELLER_TAB_PATH: Record<string, string> = {
  overview: '/seller/dashboard',
  products: '/seller/products',
  requests: '/seller/orders',
  jobs: '/seller/jobs',
  orders: '/seller/orders',
  messages: '/seller/chat',
  earnings: '/seller/earnings',
  reviews: '/seller/reviews',
  profile: '/seller/shop',
  verification: '/seller/verification',
  notifications: '/seller/notifications',
}

export const ADMIN_TAB_PATH: Record<string, string> = {
  overview: '/admin/dashboard',
  users: '/admin/users',
  sellers: '/admin/sellers',
  orders: '/admin/orders',
  commission: '/admin/commission',
  ai: '/admin/ai-monitoring',
}

// ← ADD: 'testimonials' to the ViewName union
export type ViewName =
  | 'home'
  | 'explore'
  | 'product'
  | 'categories'
  | 'find-tailors'
  | 'tailor'
  | 'designers'
  | 'designer'
  | 'ai-studio'
  | 'tryon'
  | 'about'
  | 'contact'
  | 'auth'
  | 'register'
  | 'dashboard'
  | 'testimonials'

export interface View {
  name: ViewName
  id?: string
  category?: string
  q?: string
}

export function viewToPath(view: View, role?: string | null): string {
  switch (view.name) {
    case 'home':
      return '/'

    case 'explore': {
      const qs = new URLSearchParams()
      if (view.category) qs.set('category', view.category)
      if (view.q) qs.set('q', view.q)
      const s = qs.toString()
      return `/user/explore${s ? `?${s}` : ''}`
    }

    case 'product':
      return view.id ? `/user/product/${view.id}` : '/user/explore'

    case 'categories':
      return '/user/categories'

    case 'find-tailors':
      return '/user/tailors'

    case 'tailor':
      return view.id ? `/user/tailors/${view.id}` : '/user/tailors'

    case 'designers':
      return '/user/designers'

    case 'designer':
      return view.id ? `/user/designers/${view.id}` : '/user/designers'

    case 'ai-studio':
      return '/user/ai-studio'

    case 'tryon':
      return '/user/try-on'

    case 'about':
      return '/user/about'

    case 'contact':
      return '/user/contact'

    case 'auth':
      return '/login'

    case 'register':
      return '/register'

    // ← ADD: testimonials case
    case 'testimonials':
      return '/testimonials'

    case 'dashboard': {
      const tab = view.category || 'overview'

      if (!role) return '/login'

      if (role === 'SELLER') {
        return SELLER_TAB_PATH[tab] || SELLER_TAB_PATH.overview
      }

      if (role === 'ADMIN') {
        return ADMIN_TAB_PATH[tab] || ADMIN_TAB_PATH.overview
      }

      return CUSTOMER_TAB_PATH[tab] || CUSTOMER_TAB_PATH.overview
    }

    default:
      return '/'
  }
}

export function pathToView(pathname: string): View {
  const p = pathname.replace(/\/+$/, '') || '/'
  const seg = p.split('/').filter(Boolean)

  if (p === '/') return { name: 'home' }

  // ← ADD: handle /testimonials at the root level (before the `user` check)
  if (p === '/testimonials') return { name: 'testimonials' }

  if (
    p === '/login' ||
    p === '/seller/login' ||
    p === '/admin/login'
  ) {
    return { name: 'auth' }
  }

  if (
    p === '/register' ||
    p === '/seller/register'
  ) {
    return { name: 'register' }
  }

  if (seg[0] !== 'user') return { name: 'home' }

  const [, a, b] = seg

  switch (a) {
    case undefined:
      return { name: 'home' }

    case 'explore':
      return { name: 'explore' }

    case 'product':
      return { name: 'product', id: b }

    case 'categories':
      return { name: 'categories' }

    case 'tailors':
      return b ? { name: 'tailor', id: b } : { name: 'find-tailors' }

    case 'designers':
      return b ? { name: 'designer', id: b } : { name: 'designers' }

    case 'ai-studio':
      return { name: 'ai-studio' }

    case 'try-on':
      return { name: 'tryon' }

    case 'about':
      return { name: 'about' }

    case 'contact':
      return { name: 'contact' }

    case 'login':
      return { name: 'auth' }

    case 'register':
      return { name: 'register' }

    default:
      return { name: 'dashboard' }
  }
}

export function safeNextPath(
  next: string | null | undefined,
  portal: PortalId
): string | null {
  if (!next || typeof next !== 'string') return null

  if (
    !next.startsWith('/') ||
    next.startsWith('//') ||
    next.includes('\\')
  ) return null

  const base = PORTAL_PATHS[portal].base

  if (
    next !== base &&
    !next.startsWith(`${base}/`) &&
    !next.startsWith(`${base}?`)
  ) return null

  const login = PORTAL_PATHS[portal].login
  const register = PORTAL_PATHS[portal].register

  if (
    next === login ||
    next.startsWith(`${login}/`) ||
    (register && (
      next === register ||
      next.startsWith(`${register}/`)
    ))
  ) return null

  return next
}
