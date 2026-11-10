'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store/app-store'
import { api } from '@/lib/api-client'
import type { Conversation, ChatMessage, Product, Order } from '@/types'
import { Avatar } from '@/components/common/ui-bits'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { timeAgo, inr } from '@/lib/helpers'
import { Send, MessageCircle, ArrowLeft, ShoppingBag } from 'lucide-react'

export function ChatPanel({ height = 'h-[560px]' }: { height?: string }) {
  const user = useAppStore((s) => s.user)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [online, setOnline] = useState<string[]>([])
  const [typing, setTyping] = useState<{ userId: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const socketRef = useRef<Socket | null>(null)
  const threadRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isSeller = user?.role === 'SELLER'

  const loadConversations = useCallback(async () => {
    try {
      const d = await api<{ conversations: Conversation[] }>('/chat/conversations')
      setConversations(d.conversations)
      if (!activeId && d.conversations.length > 0) setActiveId(d.conversations[0].id)
    } catch { /* not logged in */ }
    finally { setLoading(false) }

  }, [])

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const d = await api<{ messages: ChatMessage[] }>(`/chat/messages?conversationId=${conversationId}`)
      setMessages(d.messages)
    } catch { setMessages([]) }
  }, [])

  useEffect(() => { loadConversations() }, [loadConversations])

  // Socket connection
  useEffect(() => {
    if (!user) return
    const socket = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      if (activeId) {
        socket.emit('chat:join', { conversationId: activeId, userId: user.id, name: user.name })
      }
    })
    socket.on('chat:new', (data: { conversationId: string; message: ChatMessage }) => {
      if (data.conversationId === activeId) {
        setMessages((prev) => (prev.some((m) => m.id === data.message.id) ? prev : [...prev, data.message]))
      }
      loadConversations()
    })
    socket.on('chat:online', (data: { conversationId: string; onlineUsers: string[] }) => {
      if (data.conversationId === activeId) setOnline(data.onlineUsers)
    })
    socket.on('chat:typing', (data: { conversationId: string; userId: string; name: string; typing: boolean }) => {
      if (data.conversationId === activeId && data.userId !== user.id) {
        setTyping(data.typing ? { userId: data.userId, name: data.name } : null)
      }
    })

    return () => { socket.disconnect() }

  }, [user?.id])

  // Join/leave room when active conversation changes
  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !activeId || !user) return
    socket.emit('chat:join', { conversationId: activeId, userId: user.id, name: user.name })
    loadMessages(activeId)
    return () => { socket.emit('chat:leave', { conversationId: activeId }) }
  }, [activeId, user?.id, loadMessages])

  // Auto-scroll
  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  async function send() {
    const content = input.trim()
    if (!content || !activeId || !user) return
    setSending(true)
    setInput('')
    try {
      const d = await api<{ message: ChatMessage }>('/chat/messages', { method: 'POST', body: { conversationId: activeId, content } })
      setMessages((prev) => (prev.some((m) => m.id === d.message.id) ? prev : [...prev, d.message]))
      socketRef.current?.emit('chat:send', { conversationId: activeId, message: d.message })
      loadConversations()
    } catch (e) {

      console.error(e)
    } finally { setSending(false) }
  }

  function onInputChange(v: string) {
    setInput(v)
    if (!socketRef.current || !activeId || !user) return
    socketRef.current.emit('chat:typing', { conversationId: activeId, userId: user.id, name: user.name, typing: true })
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit('chat:typing', { conversationId: activeId, userId: user.id, name: user.name, typing: false })
    }, 1400)
  }

const other = (
  c: Conversation
): { name: string; avatarColor: string; id: string } => {
  if (isSeller) {
    return {
      name: c.customer?.name || 'Customer',
      avatarColor: c.customer?.avatarColor || '#7C2D3E',
      id: c.customer?.id || '',
    }
  }

  return {
    name: c.seller?.shopName || 'Shop',
    avatarColor: c.seller?.user?.avatarColor || '#7C2D3E',
    id: c.seller?.userId || '',
  }
}

  if (!user) return null

  return (
    <div className={cn('flex bg-card rounded-3xl border border-wine-100 shadow-sm overflow-hidden', height)}>
      {/* Conversation list */}
      <div className={cn('w-full sm:w-72 shrink-0 border-r border-wine-100 flex flex-col', activeId && 'hidden sm:flex')}>
        <div className="p-4 border-b border-wine-100">
          <h3 className="font-semibold text-sm text-wine-900 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-gold-600" /> Conversations
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="p-4 text-xs text-muted-foreground">Loading chats…</div>
          ) : conversations.length === 0 ? (
            <div className="p-5 text-center">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isSeller ? 'Customers who message you will appear here.' : 'Open a tailor profile and hit "Chat now" to start a conversation.'}
              </p>
            </div>
          ) : (
            conversations.map((c) => {
              const o = other(c)
              return (
                <motion.button
                  key={c.id}
                  whileHover={{ x: 3 }}
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-colors',
                    activeId === c.id ? 'bg-wine-50 border border-wine-200' : 'hover:bg-cream border border-transparent'
                  )}
                >
                  <Avatar name={o.name} color={o.avatarColor} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{o.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.lastMessage}</div>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(c.lastMessageAt)}</span>
                </motion.button>
              )
            })
          )}
        </div>
      </div>

      {/* Thread */}
      <div className={cn('flex-1 flex flex-col min-w-0', !activeId && 'hidden sm:flex')}>
        {!activeId ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8 text-center">
            Select a conversation to start chatting 💬
          </div>
        ) : (
          (() => {
          const active = conversations.find((c) => c.id === activeId)

const o = active
  ? other(active)
  : {
      name: 'Chat',
      avatarColor: '#7C2D3E',
      id: '',
    }
            const isOnline = online.filter((id) => id !== user.id).length > 0
            return (
              <>
                <div className="p-3.5 border-b border-wine-100 flex items-center gap-3 bg-cream/50">
                  <button onClick={() => setActiveId(null)} className="sm:hidden p-1.5 rounded-full hover:bg-wine-50" aria-label="Back to conversations">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <Avatar name={o.name} color={o.avatarColor} size={38} />
                  <div>
                    <div className="text-sm font-semibold">{o.name}</div>
                    <div className={cn('text-[11px] flex items-center gap-1', isOnline ? 'text-emerald-600' : 'text-muted-foreground')}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', isOnline ? 'bg-emerald-500' : 'bg-gray-300')} />
                      {typing ? `${typing.name} is typing…` : isOnline ? 'Online' : 'Offline'}
                    </div>
                  </div>
                </div>

                <div ref={threadRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-cream/30">
                  <AnimatePresence initial={false}>
                    {messages.map((m) => {
                      const mine = m.senderId === user.id
                      const isProductCard = m.type === 'PRODUCT' || m.type === 'ORDER' || m.type === 'IMAGE'
                      return (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, y: 12, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.25 }}
                          className={cn('flex', mine ? 'justify-end' : 'justify-start')}
                        >
                          <div className={cn(
                            'max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                            mine ? 'bg-wine-700 text-white rounded-br-md' : 'bg-card text-foreground border border-wine-100 rounded-bl-md',
                            isProductCard && 'bg-gold-50 border-gold-200'
                          )}>
                            {isProductCard && (
                              <div className="flex items-center gap-1.5 text-xs font-bold mb-1 text-gold-700">
                                <ShoppingBag className="w-3 h-3" /> {m.type === 'ORDER' ? 'Order update' : m.type === 'IMAGE' ? 'AI Design' : 'Product shared'}
                              </div>
                            )}
                            <p className="leading-relaxed break-words">{m.content}</p>
                            <span className={cn('text-[9px] mt-1 block', mine ? 'text-white/60' : 'text-muted-foreground')}>
                              {timeAgo(m.createdAt)}
                            </span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                  {typing && (
                    <div className="flex justify-start">
                      <div className="bg-card border border-wine-100 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5">
                        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-wine-400 inline-block" />
                        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-wine-400 inline-block" />
                        <span className="typing-dot w-1.5 h-1.5 rounded-full bg-wine-400 inline-block" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-wine-100 flex gap-2 bg-card">
                  <Input
                    value={input}
                    onChange={(e) => onInputChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                    placeholder={isSeller ? 'Reply to customer…' : 'Message the tailor…'}
                    className="flex-1 h-11 bg-cream border-wine-200 rounded-full"
                    aria-label="Message input"
                  />
                  <Button onClick={send} disabled={sending || !input.trim()} size="icon" className="w-11 h-11 rounded-full bg-wine-700 hover:bg-wine-800 shrink-0" aria-label="Send message">
                    <Send className={cn('w-4.5 h-4.5 w-[18px] h-[18px]', sending && 'opacity-50')} />
                  </Button>
                </div>
              </>
            )
          })()
        )}
      </div>
    </div>
  )
}

// Share product to chat (helper used in chat contexts)
export function shareProductToChat(conversationId: string, product: Product) {
  return api('/chat/messages', {
    method: 'POST',
    body: { conversationId, content: `${product.name} — ${inr(product.price)}`, type: 'PRODUCT', refId: product.id },
  })
}

export function shareOrderToChat(conversationId: string, order: Order) {
  return api('/chat/messages', {
    method: 'POST',
    body: { conversationId, content: `Order ${order.orderNumber} · ${inr(order.totalAmount)}`, type: 'ORDER', refId: order.id },
  })
}
