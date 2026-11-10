'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { api } from '@/lib/api-client'
import type { Seller } from '@/types'
import { Spinner, EmptyState, Avatar, VerifiedBadge, RatingStars } from '@/components/common/ui-bits'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapPin, Search, Star, Navigation, Package, Award, Scan, Crosshair } from 'lucide-react'
import { cn } from '@/lib/utils'

const RADIUS_OPTIONS = [
  { km: 5, label: '5 km' },
  { km: 10, label: '10 km' },
  { km: 15, label: '15 km' },
  { km: 20, label: '20 km' },
  { km: 999, label: 'Any' },
]

export function FindTailorsView() {
  const navigate = useAppStore((s) => s.navigate)
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [radius, setRadius] = useState(10)
  const [locating, setLocating] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [geoError, setGeoError] = useState(false)

  async function locate() {
    setLocating(true)
    setGeoError(false)
    if (!navigator.geolocation) {
      // Fallback: Pune center (demo location from the architecture doc)
      setCoords({ lat: 18.5204, lng: 73.8567 })
      setLocating(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false) },
      () => { setCoords({ lat: 18.5204, lng: 73.8567 }); setGeoError(true); setLocating(false) },
      { timeout: 6000 }
    )
  }

  useEffect(() => {
    const t = setTimeout(() => { if (!coords) locate() }, 0)
    return () => clearTimeout(t)
     
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams({ verified: '1', radius: String(radius) })
      if (q) params.set('q', q)
      if (coords) { params.set('lat', String(coords.lat)); params.set('lng', String(coords.lng)) }
      setLoading(true)
      api<{ sellers: Seller[] }>(`/sellers?${params}`)
        .then((d) => setSellers(d.sellers))
        .catch(() => setSellers([]))
        .finally(() => setLoading(false))
    }, 0)
    return () => clearTimeout(t)
  }, [q, radius, coords])

  // Map projection: scale lat/lng into the map box
  const lats = sellers.map((s) => s.lat).concat(coords ? [coords.lat] : [])
  const lngs = sellers.map((s) => s.lng).concat(coords ? [coords.lng] : [])
  const minLat = Math.min(...lats) - 0.012, maxLat = Math.max(...lats) + 0.012
  const minLng = Math.min(...lngs) - 0.012, maxLng = Math.max(...lngs) + 0.012
  const project = (lat: number, lng: number) => ({
    x: ((lng - minLng) / (maxLng - minLng || 1)) * 100,
    y: 100 - ((lat - minLat) / (maxLat - minLat || 1)) * 100,
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-wine-900">Find Tailors Near You</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {coords
              ? <>Showing verified tailors within <b className="text-wine-800">{radius === 999 ? 'any' : radius + ' km'}</b> of your location{geoError ? ' (demo: Pune centre)' : ''}</>
              : 'Detecting your location…'}
          </p>
        </div>
        <Button onClick={locate} variant="outline" disabled={locating} className="rounded-full gap-2 border-wine-300 text-wine-800 shrink-0">
          <Crosshair className={cn('w-4 h-4', locating && 'animate-spin')} />
          {locating ? 'Locating…' : coords ? 'Refresh location' : 'Use my location'}
        </Button>
      </div>

      {/* Search + radius */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search shop, specialty or area…" className="pl-10 h-11 bg-card border-wine-200 rounded-full" aria-label="Search tailors" />
        </div>
        <div className="flex gap-2 items-center overflow-x-auto pb-1">
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r.km}
              onClick={() => setRadius(r.km)}
              className={cn(
                'shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all',
                radius === r.km ? 'bg-wine-700 text-white border-wine-700 shadow-md' : 'bg-card border-wine-200 text-foreground/70 hover:border-wine-400'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Stylized live map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-3 relative rounded-3xl overflow-hidden border border-wine-100 shadow-lg bg-[#EAF0E5] h-[420px] lg:h-auto lg:min-h-[480px]"
        >
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
            <path d="M0 22 Q30 18 55 24 T100 20" stroke="#CFE0C8" strokeWidth="2.5" fill="none" />
            <path d="M0 52 Q28 48 60 54 T100 50" stroke="#D8E6D0" strokeWidth="3.5" fill="none" />
            <path d="M0 80 Q35 75 65 82 T100 78" stroke="#CFE0C8" strokeWidth="2" fill="none" />
            <path d="M22 0 Q25 35 20 70 T26 100" stroke="#E2ECD9" strokeWidth="2.2" fill="none" />
            <path d="M55 0 Q58 40 52 75 T58 100" stroke="#DDE9D4" strokeWidth="3" fill="none" />
            <path d="M82 0 Q78 30 84 65 T80 100" stroke="#E2ECD9" strokeWidth="2" fill="none" />
            <rect x="8" y="30" width="9" height="6" rx="1" fill="#D8E6D0" />
            <rect x="62" y="34" width="12" height="8" rx="1" fill="#D8E6D0" />
            <rect x="32" y="60" width="10" height="7" rx="1" fill="#DDE9D4" />
            <rect x="86" y="70" width="8" height="6" rx="1" fill="#D8E6D0" />
            <rect x="12" y="88" width="14" height="7" rx="1" fill="#DDE9D4" />
            <circle cx="70" cy="14" r="5" fill="#D3E4CB" />
            <circle cx="40" cy="86" r="7" fill="#D3E4CB" />
          </svg>

          {/* Radius ring */}
          {coords && radius !== 999 && (
            <motion.div
              key={`${radius}-${coords.lat}`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square rounded-full border-2 border-dashed border-wine-500/50 bg-wine-500/5"
              style={{ width: '58%' }}
            >
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white text-wine-800 text-[10px] font-bold px-2 py-0.5 rounded-full shadow border border-wine-100">{radius} km</span>
            </motion.div>
          )}

          {/* You marker */}
          {coords && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20" style={{}}>
              <motion.div animate={{ scale: [1, 1.6], opacity: [0.5, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute inset-0 -m-2 rounded-full bg-teal-500" />
              <div className="relative w-5 h-5 rounded-full bg-teal-600 border-[3px] border-white shadow-lg z-10" title="Your location" />
              <span className="absolute top-6 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow whitespace-nowrap">YOU</span>
            </div>
          )}

          {/* Shop markers */}
          {!loading && sellers.map((s, i) => {
            const pos = project(s.lat, s.lng)
            const isSelected = selected === s.id
            return (
              <motion.button
                key={s.id}
                initial={{ scale: 0, y: -20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1, type: 'spring', stiffness: 300, damping: 16 }}
                whileHover={{ scale: 1.12, zIndex: 40 }}
                onClick={() => { setSelected(s.id); navigate({ name: 'tailor', id: s.id }) }}
                className="absolute z-10 flex flex-col items-center -translate-x-1/2 -translate-y-full"
                style={{ left: `${Math.min(Math.max(pos.x, 8), 92)}%`, top: `${Math.min(Math.max(pos.y, 14), 90)}%` }}
                aria-label={`Open ${s.shopName}`}
              >
                <div className={cn(
                  'px-2.5 py-1.5 rounded-xl shadow-lg text-[10px] font-bold whitespace-nowrap border-2 transition-all',
                  isSelected ? 'bg-gold-500 text-wine-900 border-white scale-110' : 'bg-white text-wine-800 border-white'
                )}>
                  ✂ {s.shopName.split(' ').slice(0, 2).join(' ')}
                  <span className="block text-[9px] font-semibold text-amber-600 flex items-center gap-0.5 justify-center">
                    <Star className="w-2 h-2 fill-amber-500 text-amber-500" /> {s.rating.toFixed(1)}
                    {s.distanceKm !== undefined && <span className="text-muted-foreground">· {s.distanceKm}km</span>}
                  </span>
                </div>
                <div className={cn('w-2.5 h-2.5 rotate-45 -mt-1 rounded-sm shadow', isSelected ? 'bg-gold-500' : 'bg-wine-700')} />
              </motion.button>
            )
          })}

          {/* Legend */}
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur rounded-xl px-3 py-2 text-[10px] font-medium shadow border border-wine-100 flex gap-3">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-600" /> You</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rotate-45 bg-wine-700" /> Verified tailors</span>
          </div>

          {loading && (
            <div className="absolute inset-0 bg-cream/60 backdrop-blur-sm flex items-center justify-center">
              <Spinner className="py-0" />
            </div>
          )}
        </motion.div>

        {/* List */}
        <div className="lg:col-span-2 space-y-3.5 max-h-[560px] overflow-y-auto pr-1">
          {loading ? (
            <Spinner />
          ) : sellers.length === 0 ? (
            <EmptyState icon="📍" title="No tailors in this radius" subtitle="Try increasing the distance filter or search a different area." />
          ) : (
            sellers.map((s, i) => (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ x: 4 }}
                onClick={() => navigate({ name: 'tailor', id: s.id })}
                className={cn(
                  'w-full text-left bg-card rounded-2xl border p-4 flex gap-3.5 items-start shadow-sm hover:shadow-lg transition-all',
                  selected === s.id ? 'border-gold-400' : 'border-wine-100'
                )}
              >
                <Avatar name={s.shopName} color="#7C2D3E" size={46} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-sm truncate">{s.shopName}</span>
                    <VerifiedBadge status={s.verificationStatus} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {s.address || s.city}
                    {s.distanceKm !== undefined && <span className="font-semibold text-wine-800"> · {s.distanceKm} km</span>}
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-xs">
                    <RatingStars rating={s.rating} size={11} showValue />
                    <span className="text-muted-foreground flex items-center gap-1"><Package className="w-3 h-3" />{s.productCount} products</span>
                    <span className="text-muted-foreground flex items-center gap-1"><Award className="w-3 h-3" />{s.experienceYears}y</span>
                  </div>
                </div>
                <Navigation className="w-4 h-4 text-wine-400 shrink-0 mt-1" />
              </motion.button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
