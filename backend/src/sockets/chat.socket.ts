import { Server, Socket } from "socket.io";
import { assertMember, markConversationRead, sendMessage } from "../modules/chat/chat.service";

export const registerChatHandlers = (_io: Server, socket: Socket) => {
  const userId: string = socket.data.userId;

  socket.on("conversation:join", async (conversationId: string, ack?: Function) => {
    try {
      await assertMember(conversationId, userId);
      socket.join(`conversation:${conversationId}`);
      ack?.({ ok: true });
    } catch (e: any) { ack?.({ ok: false, message: e.message }); }
  });

  socket.on("conversation:leave", (conversationId: string) => socket.leave(`conversation:${conversationId}`));

  socket.on("message:send", async (data: { conversationId: string; text?: string; attachments?: any[] }, ack?: Function) => {
    try {
      const message = await sendMessage(data.conversationId, userId, data);
      ack?.({ ok: true, message });
    } catch (e: any) { ack?.({ ok: false, message: e.message }); }
  });

  socket.on("typing", (data: { conversationId: string; isTyping: boolean }) => {
    if (socket.rooms.has(`conversation:${data.conversationId}`)) {
      socket.to(`conversation:${data.conversationId}`).emit("typing", { conversationId: data.conversationId, userId, isTyping: !!data.isTyping });
    }
  });

  socket.on("message:read", async (conversationId: string) => {
    try { await markConversationRead(conversationId, userId); } catch { /* ignore */ }
  });
};
