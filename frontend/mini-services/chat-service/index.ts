// AI Tailor — Real-time Chat Service (socket.io mini-service, port 3003)
// Rooms: conversation:<id> — customers & sellers join only their own conversations.
// Persistence happens via the Next.js REST API; this service handles realtime
// delivery, typing indicators and online presence.
import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  // DO NOT change the path, it is used by Caddy to forward the request to the correct port
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

interface Presence {
  socketId: string
  userId: string
  name: string
  conversationId: string
}

const presence = new Map<string, Presence>() // socketId -> presence
const onlineByConversation = new Map<string, Set<string>>() // conversationId -> userIds

io.on('connection', (socket) => {
  console.log(`[chat] connected: ${socket.id}`)

  socket.on('chat:join', (data: { conversationId: string; userId: string; name: string }) => {
    const { conversationId, userId, name } = data
    if (!conversationId || !userId) return

    socket.join(`conversation:${conversationId}`)
    presence.set(socket.id, { socketId: socket.id, userId, name, conversationId })

    const set = onlineByConversation.get(conversationId) || new Set<string>()
    set.add(userId)
    onlineByConversation.set(conversationId, set)

    // Notify the room about online users
    io.to(`conversation:${conversationId}`).emit('chat:online', {
      conversationId,
      onlineUsers: Array.from(set),
    })
  })

  socket.on('chat:leave', (data: { conversationId: string }) => {
    const p = presence.get(socket.id)
    const conversationId = data?.conversationId || p?.conversationId
    if (!conversationId) return
    socket.leave(`conversation:${conversationId}`)
    const set = onlineByConversation.get(conversationId)
    if (set) {
      if (p) set.delete(p.userId)
      if (set.size === 0) onlineByConversation.delete(conversationId)
      io.to(`conversation:${conversationId}`).emit('chat:online', {
        conversationId,
        onlineUsers: Array.from(set || []),
      })
    }
    presence.delete(socket.id)
  })

  // Broadcast a freshly persisted message (REST API persisted it already)
  socket.on('chat:send', (data: { conversationId: string; message: unknown }) => {
    const { conversationId, message } = data
    if (!conversationId || !message) return
    socket.to(`conversation:${conversationId}`).emit('chat:new', { conversationId, message })
  })

  socket.on('chat:typing', (data: { conversationId: string; userId: string; name: string; typing: boolean }) => {
    const { conversationId, userId, name, typing } = data
    if (!conversationId) return
    socket.to(`conversation:${conversationId}`).emit('chat:typing', { conversationId, userId, name, typing })
  })

  socket.on('chat:read', (data: { conversationId: string; userId: string }) => {
    const { conversationId, userId } = data
    if (!conversationId || !userId) return
    socket.to(`conversation:${conversationId}`).emit('chat:read', { conversationId, userId })
  })

  socket.on('disconnect', () => {
    const p = presence.get(socket.id)
    if (p) {
      const set = onlineByConversation.get(p.conversationId)
      if (set) {
        set.delete(p.userId)
        if (set.size === 0) onlineByConversation.delete(p.conversationId)
        io.to(`conversation:${p.conversationId}`).emit('chat:online', {
          conversationId: p.conversationId,
          onlineUsers: Array.from(set),
        })
      }
      presence.delete(socket.id)
    }
    console.log(`[chat] disconnected: ${socket.id}`)
  })

  socket.on('error', (err) => console.error(`[chat] socket error ${socket.id}:`, err))
})

const PORT = 3003
httpServer.listen(PORT, () => console.log(`[chat] AI Tailor chat service running on port ${PORT}`))

process.on('SIGTERM', () => httpServer.close(() => process.exit(0)))
process.on('SIGINT', () => httpServer.close(() => process.exit(0)))
