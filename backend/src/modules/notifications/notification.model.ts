import { Schema, model } from "mongoose";
import { oid } from "../../utils/mongo";

const notificationSchema = new Schema(
  {
    userId: { ...oid("User", true), index: true },
    type: {
      type: String,
      enum: ["order", "approval", "payment", "chat", "design", "review", "system"],
      default: "system",
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const Notification = model("Notification", notificationSchema);
