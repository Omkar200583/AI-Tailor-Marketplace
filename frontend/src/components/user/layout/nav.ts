import {
  LayoutDashboard, ShoppingBag, ShoppingCart, Ruler, Heart, Sparkles, ScanFace,
  MessageCircle, Bell, Settings,
} from 'lucide-react'
import type { NavGroup } from '@/components/shared/layout/types'

export function userNavGroups(cartCount: number, unread: number): NavGroup[] {
  return [
    {
      label: 'Shopping',
      items: [
        { href: '/user/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/user/orders', label: 'My Orders', icon: ShoppingBag },
        { href: '/user/cart', label: 'Cart', icon: ShoppingCart, badge: cartCount },
        { href: '/user/wishlist', label: 'Wishlist', icon: Heart },
      ],
    },
    {
      label: 'Fit & Style',
      items: [
        { href: '/user/measurements', label: 'Measurements', icon: Ruler },
        { href: '/user/designs', label: 'My AI Designs', icon: Sparkles },
        { href: '/user/try-on-history', label: 'Try-On History', icon: ScanFace },
      ],
    },
    {
      label: 'Inbox',
      items: [
        { href: '/user/chat', label: 'Messages', icon: MessageCircle },
        { href: '/user/notifications', label: 'Notifications', icon: Bell, badge: unread },
      ],
    },
    {
      label: 'Account',
      items: [{ href: '/user/settings', label: 'Settings', icon: Settings }],
    },
  ]
}
