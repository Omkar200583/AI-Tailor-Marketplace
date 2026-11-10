import { Schema, model } from "mongoose";
import { oid } from "../../utils/mongo";

const supportTicketSchema = new Schema(
  {
    userId: { ...oid("User", true), index: true },
    orderId: oid("Order"),
    subject: { type: String, required: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 4000 },
    category: { type: String, enum: ["order", "payment", "account", "ai", "other"], default: "other" },
    status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open", index: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    responses: [{ authorId: oid("User"), text: String, at: { type: Date, default: Date.now }, _id: false }],
    assignedTo: oid("User"),
  },
  { timestamps: true }
);

export const SupportTicket = model("SupportTicket", supportTicketSchema, "support_tickets");
