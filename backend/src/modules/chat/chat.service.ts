import { Types } from "mongoose";
import { ApiError } from "../../utils/ApiError";
import { emitToUser, getIO } from "../../sockets";
import { Conversation } from "./conversation.model";
import { Message } from "./message.model";

export const pairKey = (a: string, b: string) => [a, b].sort().join("_");

export const findOrCreateConversation = async (a: string, b: string, extra: { orderId?: string; designRequestId?: string } = {}) => {
  if (a === b) throw ApiError.badRequest("Cannot start a conversation with yourself");
  const key = pairKey(a, b);
  let convo = await Conversation.findOne({ participantKey: key });
  if (!convo) convo = await Conversation.create({ participants: [a, b], participantKey: key, ...extra });
  else if (extra.orderId || extra.designRequestId) {
    Object.assign(convo, extra);
    await convo.save();
  }
  return convo;
};

export const assertMember = async (conversationId: string, userId: string) => {
  const convo = await Conversation.findById(conversationId);
  if (!convo || !convo.participants.some((p: any) => String(p) === userId)) throw ApiError.forbidden("Not a participant of this conversation");
  return convo;
};

export const sendMessage = async (conversationId: string, senderId: string, payload: { text?: string; attachments?: any[] }) => {
  if (!payload.text?.trim() && !payload.attachments?.length) throw ApiError.badRequest("Message cannot be empty");
  const convo = await assertMember(conversationId, senderId);
  const message = await Message.create({ conversationId, senderId, text: payload.text, attachments: payload.attachments, readBy: [senderId] });

  const other = String(convo.participants.find((p: any) => String(p) !== senderId));
  convo.lastMessage = { text: payload.text || "[attachment]", senderId: new Types.ObjectId(senderId), at: new Date() } as any;
  convo.unread.set(other, (convo.unread.get(other) || 0) + 1);
  await convo.save();

  getIO()?.to(`conversation:${conversationId}`).emit("message:new", message);
  emitToUser(other, "conversation:updated", { conversationId, lastMessage: convo.lastMessage });
  return message;
};

export const markConversationRead = async (conversationId: string, userId: string) => {
  const convo = await assertMember(conversationId, userId);
  await Message.updateMany({ conversationId, readBy: { $ne: userId } }, { $addToSet: { readBy: userId } });
  convo.unread.set(userId, 0);
  await convo.save();
  getIO()?.to(`conversation:${conversationId}`).emit("message:read", { conversationId, userId });
};
