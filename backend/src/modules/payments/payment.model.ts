import { Schema, model } from "mongoose";
import { oid } from "../../utils/mongo";

const paymentSchema = new Schema(
  {
    orderId: { ...oid("Order", true), index: true },
    userId: { ...oid("User", true), index: true },
    sellerId: { ...oid("User", true), index: true },
    gateway: { type: String, default: "razorpay" },
    razorpayOrderId: { type: String, index: true, unique: true, sparse: true },
    razorpayPaymentId: { type: String, index: true },
    razorpaySignature: String,
    amount: { type: Number, required: true }, // in rupees
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["created", "paid", "failed", "refunded"], default: "created", index: true },
    method: String,
    failureReason: String,
    paidAt: Date,
  },
  { timestamps: true }
);

export const Payment = model("Payment", paymentSchema);
