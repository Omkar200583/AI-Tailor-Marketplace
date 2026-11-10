import { LayoutDashboard, Users, ShieldCheck, ClipboardList, Wallet, Bot } from 'lucide-react'
import type { NavGroup } from '@/components/shared/layout/types'

export function adminNavGroups(pendingVerifications: number): NavGroup[] {
  return [
    { label: 'Overview', items: [{ href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
    {
      label: 'Management',
      items: [
        { href: '/admin/users', label: 'Users', icon: Users },
        { href: '/admin/sellers', label: 'Sellers', icon: ShieldCheck, badge: pendingVerifications },
        { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
      ],
    },
    {
      label: 'Platform',
      items: [
        { href: '/admin/commission', label: 'Commission', icon: Wallet },
        { href: '/admin/ai-monitoring', label: 'AI monitoring', icon: Bot },
      ],
    },
  ]
}
