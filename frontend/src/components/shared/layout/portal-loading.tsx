import { Loader2 } from 'lucide-react'

export function PortalLoading({ label = 'Loading your workspace…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="w-7 h-7 animate-spin text-wine-600" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
