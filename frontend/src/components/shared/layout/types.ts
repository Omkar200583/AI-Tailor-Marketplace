import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: number
}

export interface NavGroup {
  label?: string
  items: NavItem[]
}

export function isNavActive(pathname: string, href: string): boolean {
  // Dashboard-style roots must match exactly; everything else matches nested routes too.
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function findActiveNav(groups: NavGroup[], pathname: string): NavItem | undefined {
  return groups.flatMap((g) => g.items).find((i) => isNavActive(pathname, i.href))
}
