// Shared helpers: JSON parse for SQLite stringified fields + formatting

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function inr(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function orderStatusMeta(status: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    REQUESTED: { label: 'Pending Approval', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    ACCEPTED: { label: 'Accepted · Pay Now', color: 'bg-sky-100 text-sky-800 border-sky-200' },
    REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200' },
    CONFIRMED: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    IN_PRODUCTION: { label: 'In Production', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    READY: { label: 'Ready for Delivery', color: 'bg-teal-100 text-teal-800 border-teal-200' },
    DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-800 border-green-200' },
    COMPLETED: { label: 'Completed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600 border-gray-200' },
    MEASUREMENTS_CONFIRMED: { label: 'Measurements Confirmed', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    DISPATCHED: { label: 'Shipped', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  }
  return map[status] || { label: status, color: 'bg-gray-100 text-gray-700 border-gray-200' }
}

export const COMMISSION_RATE = 0.05

export function calcOrderTotals(subtotal: number) {
  const commission = Math.round(subtotal * COMMISSION_RATE)
  return {
    subtotal,
    commission,
    sellerEarning: subtotal - commission,
  }
}


// Add this helper at the bottom:
export function calcOrderTotalsWithSplit(subtotal: number) {
  const base = calcOrderTotals(subtotal)
  const advanceAmount = Math.round(subtotal * 0.25 * 100) / 100
  const remainingAmount = Math.round((subtotal - advanceAmount) * 100) / 100
  return { ...base, advanceAmount, remainingAmount }
}
