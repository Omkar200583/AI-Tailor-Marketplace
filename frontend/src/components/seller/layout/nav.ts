import {
  LayoutDashboard, Package, Inbox, MessageCircle, IndianRupee, Star, Store, BadgeCheck, Bell, Scissors,
} from 'lucide-react'
import type { NavGroup } from '@/components/shared/layout/types'

export function sellerNavGroups(unread: number): NavGroup[] {
  return [
    {
      label: 'Business',
      items: [
        { href: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/seller/orders', label: 'Orders', icon: Inbox },
        { href: '/seller/jobs', label: 'Active Jobs', icon: Scissors },
        { href: '/seller/products', label: 'Products', icon: Package },
        { href: '/seller/earnings', label: 'Earnings', icon: IndianRupee },
      ],
    },
    {
      label: 'Customers',
      items: [
        { href: '/seller/chat', label: 'Messages', icon: MessageCircle },
        { href: '/seller/reviews', label: 'Reviews', icon: Star },
        { href: '/seller/notifications', label: 'Notifications', icon: Bell, badge: unread },
      ],
    },
    {
      label: 'My shop',
      items: [
        { href: '/seller/shop', label: 'Shop profile', icon: Store },
        { href: '/seller/verification', label: 'Verification', icon: BadgeCheck },
      ],
    },
  ]
}
