import { Schema, model } from "mongoose";
import { oid } from "../../utils/mongo";

const orderApprovalSchema = new Schema(
  {
    orderId: { ...oid("Order", true), unique: true },
    sellerId: { ...oid("User", true), index: true },
    userId: { ...oid("User", true) },
    status: { type: String, enum: ["pending", "approved", "rejected", "expired"], default: "pending", index: true },
    note: String,
    estimatedDeliveryDays: Number,
    decidedAt: Date,
  },
  { timestamps: true }
);

export const OrderApproval = model("OrderApproval", orderApprovalSchema, "order_approvals");
