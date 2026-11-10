import { Schema, model } from "mongoose";
import { oid } from "../../utils/mongo";

const conversationSchema = new Schema(
  {
    participants: { type: [oid("User", true)], validate: (v: any[]) => v.length === 2 },
    participantKey: { type: String, required: true, unique: true }, // sorted "idA_idB" -> one conversation per pair
    orderId: oid("Order"),
    designRequestId: oid("DesignRequest"),
    lastMessage: { text: String, senderId: oid("User"), at: Date },
    unread: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);
conversationSchema.index({ participants: 1, updatedAt: -1 });

export const Conversation = model("Conversation", conversationSchema);
