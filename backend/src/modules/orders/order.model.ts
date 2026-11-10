import { Schema, model } from "mongoose";
import { oid } from "../../utils/mongo";

export const ORDER_STATUSES = [
  "pending_approval", "approved", "rejected", "confirmed", "stitching", "ready", "shipped", "delivered", "cancelled",
] as const;

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { ...oid("User", true), index: true },
    sellerId: { ...oid("User", true), index: true },
    shopId: oid("Shop"),
    shippingAddress: { type: Schema.Types.Mixed, required: true }, // address snapshot
    measurements: { type: Schema.Types.Mixed }, // body profile snapshot
    subtotal: { type: Number, required: true },
    stitchingTotal: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ORDER_STATUSES, default: "pending_approval", index: true },
    paymentStatus: { type: String, enum: ["unpaid", "paid", "failed", "refund_pending", "refunded"], default: "unpaid" },
    estimatedDeliveryDays: Number,
    notes: String,
    statusHistory: [{ status: String, note: String, at: { type: Date, default: Date.now }, _id: false }],
  },
  { timestamps: true }
);

export const Order = model("Order", orderSchema);
