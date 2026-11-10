import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { getPagination, pageMeta } from "../../utils/pagination";
import { User } from "../users/user.model";
import { Conversation } from "./conversation.model";
import { Message } from "./message.model";
import { assertMember, findOrCreateConversation, markConversationRead, sendMessage } from "./chat.service";

export const listConversations = asyncHandler(async (req, res) => {
  const items = await Conversation.find({ participants: req.user!.id }).sort({ updatedAt: -1 }).populate("participants", "name profileImage role");
  ok(res, items);
});

export const createConversation = asyncHandler(async (req, res) => {
  const { participantId, orderId, designRequestId } = req.body;
  const other = await User.findOne({ _id: participantId, isActive: true });
  if (!other) throw ApiError.notFound("User not found");
  const convo = await findOrCreateConversation(req.user!.id, participantId, { orderId, designRequestId });
  created(res, await convo.populate("participants", "name profileImage role"), "Conversation ready");
});

export const listMessages = asyncHandler(async (req, res) => {
  await assertMember(req.params.conversationId, req.user!.id);
  const { page, limit, skip } = getPagination(req.query, 50, 200);
  const [items, total] = await Promise.all([
    Message.find({ conversationId: req.params.conversationId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Message.countDocuments({ conversationId: req.params.conversationId }),
  ]);
  await markConversationRead(req.params.conversationId, req.user!.id);
  ok(res, items.reverse(), "Success", 200, pageMeta(total, page, limit));
});

export const postMessage = asyncHandler(async (req, res) => {
  const { conversationId, ...payload } = req.body;
  created(res, await sendMessage(conversationId, req.user!.id, payload));
});
