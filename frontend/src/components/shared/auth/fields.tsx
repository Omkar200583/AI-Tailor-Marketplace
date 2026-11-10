'use client'

import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface FieldProps extends Omit<React.ComponentProps<'input'>, 'id'> {
  label: string
  icon?: LucideIcon
  error?: string | null
  hint?: string
}

/** Accessible labelled input with inline error + optional leading icon. */
export function TextField({ label, icon: Icon, error, hint, className, ...props }: FieldProps) {
  const id = useId()
  const errId = `${id}-err`
  return (
    <div>
      <Label htmlFor={id} className="text-sm">{label}</Label>
      <div className="relative mt-1.5">
        {Icon && <Icon aria-hidden className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
        <Input
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          className={cn('h-11 bg-cream border-wine-200', Icon && 'pl-10', error && 'border-red-400 focus-visible:ring-red-300', className)}
          {...props}
        />
      </div>
      {error ? <p id={errId} className="text-xs text-red-600 mt-1">{error}</p> : hint ? <p className="text-xs text-muted-foreground mt-1">{hint}</p> : null}
    </div>
  )
}

export function PasswordField({ label = 'Password', icon, error, hint, ...props }: Omit<FieldProps, 'type'>) {
  const [show, setShow] = useState(false)
  const id = useId()
  const errId = `${id}-err`
  const Icon = icon
  return (
    <div>
      <Label htmlFor={id} className="text-sm">{label}</Label>
      <div className="relative mt-1.5">
        {Icon && <Icon aria-hidden className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          aria-invalid={!!error}
          aria-describedby={error ? errId : undefined}
          className={cn('h-11 bg-cream border-wine-200 pr-11', Icon && 'pl-10', error && 'border-red-400 focus-visible:ring-red-300')}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-wine-700 focus-visible:ring-2 focus-visible:ring-ring outline-none"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error ? <p id={errId} className="text-xs text-red-600 mt-1">{error}</p> : hint ? <p className="text-xs text-muted-foreground mt-1">{hint}</p> : null}
    </div>
  )
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3">{message}</div>
}
