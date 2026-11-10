'use client'

import { Avatar } from '@/components/common/ui-bits'
import { useAppStore } from '@/store/app-store'

export function SidebarUserChip({ roleLabel }: { roleLabel?: string }) {
  const user = useAppStore((s) => s.user)
  if (!user) return null
  return (
    <div className="p-5 border-b border-sidebar-border">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} color={user.avatarColor} size={44} />
        <div className="min-w-0">
          <div className="font-semibold text-sm text-white truncate">{user.name}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-sidebar-primary truncate">{roleLabel || user.role}</div>
        </div>
      </div>
    </div>
  )
}
