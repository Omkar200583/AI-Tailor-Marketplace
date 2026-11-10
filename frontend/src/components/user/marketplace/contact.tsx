'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { Mail, MapPin, Phone, Send } from 'lucide-react'

// ─────────── Contact ───────────
export function ContactView() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.message) { toast({ title: 'Name and message are required', variant: 'destructive' }); return }
    setSent(true)
    toast({ title: 'Message sent ✉️', description: 'Our team replies within one working day.' })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 grid md:grid-cols-2 gap-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="font-display text-4xl font-bold text-wine-900">Get in touch</h1>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed max-w-md">
          Questions about orders, tailor onboarding or partnerships? Write to us — we answer fast.
        </p>
        <div className="mt-8 space-y-4">
          {[
            { icon: Mail, label: 'Email', value: 'hello@aitailor.in' },
            { icon: Phone, label: 'Phone', value: '+91 20 4000 1234' },
            { icon: MapPin, label: 'Office', value: '4th Floor, Startup Hub, Baner Road, Pune 411045' },
          ].map((c) => (
            <div key={c.label} className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-wine-50 border border-wine-100 flex items-center justify-center">
                <c.icon className="w-5 h-5 text-wine-700" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{c.label}</div>
                <div className="text-sm font-semibold">{c.value}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
        onSubmit={submit}
        className="bg-card rounded-3xl border border-wine-100 p-6 shadow-sm space-y-4 h-fit"
      >
        {sent ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-10">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="font-display font-bold text-xl text-wine-900">Message received!</h3>
            <p className="text-sm text-muted-foreground mt-1.5">We&apos;ll reply to {form.email || 'your email'} within 24 hours.</p>
            <Button type="button" variant="outline" onClick={() => { setSent(false); setForm({ name: '', email: '', message: '' }) }} className="mt-5 rounded-full border-wine-300 text-wine-800">
              Send another
            </Button>
          </motion.div>
        ) : (
          <>
            <h3 className="font-display font-bold text-xl text-wine-900">Send a message</h3>
            <div>
              <label className="text-sm font-semibold">Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5 bg-cream border-wine-200" placeholder="Your name" />
            </div>
            <div>
              <label className="text-sm font-semibold">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5 bg-cream border-wine-200" placeholder="you@example.com" />
            </div>
            <div>
              <label className="text-sm font-semibold">Message *</label>
              <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} className="mt-1.5 bg-cream border-wine-200" placeholder="How can we help?" />
            </div>
            <Button type="submit" className="w-full h-11 bg-wine-700 hover:bg-wine-800 text-white rounded-xl gap-2 font-semibold">
              <Send className="w-4 h-4" /> Send message
            </Button>
          </>
        )}
      </motion.form>
    </div>
  )
}
