import { Schema, model } from "mongoose";
import { oid } from "../../utils/mongo";

const messageSchema = new Schema(
  {
    conversationId: { ...oid("Conversation", true), index: true },
    senderId: { ...oid("User", true) },
    text: { type: String, trim: true, maxlength: 4000 },
    attachments: [{ url: String, type: { type: String, enum: ["image", "design", "file"], default: "image" }, _id: false }],
    readBy: [oid("User")],
  },
  { timestamps: true }
);
messageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message = model("Message", messageSchema);
