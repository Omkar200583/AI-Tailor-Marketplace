'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { isNavActive, type NavGroup } from './types'

/** Route-based sidebar list shared by all three portals (each portal supplies its own groups + density). */
export function SidebarNav({
  groups,
  onNavigate,
  dense = false,
  label = 'Portal navigation',
}: {
  groups: NavGroup[]
  onNavigate?: () => void
  dense?: boolean
  label?: string
}) {
  const pathname = usePathname()

  return (
    <nav aria-label={label} className="flex-1 overflow-y-auto py-3 px-2.5 space-y-4">
      {groups.map((g, gi) => (
        <div key={g.label || gi}>
          {g.label && (
            <div className="px-3.5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/40">{g.label}</div>
          )}
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const active = isNavActive(pathname, item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative flex items-center gap-3 px-3.5 rounded-xl font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                      dense ? 'py-2 text-[13px]' : 'py-2.5 text-sm',
                      active ? 'bg-sidebar-accent text-white' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-white'
                    )}
                  >
                    <item.icon className={cn('w-[18px] h-[18px] shrink-0', active && 'text-sidebar-primary')} />
                    <span className="truncate">{item.label}</span>
                    {!!item.badge && (
                      <span className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-[10px] font-bold flex items-center justify-center">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                    {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-sidebar-primary" />}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
