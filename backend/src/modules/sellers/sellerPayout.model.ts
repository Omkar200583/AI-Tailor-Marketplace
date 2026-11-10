import { Schema, model } from "mongoose";
import { oid } from "../../utils/mongo";

const sellerPayoutSchema = new Schema(
  {
    sellerId: { ...oid("User", true), index: true },
    amount: { type: Number, required: true },
    commissionIds: [oid("Commission")],
    status: { type: String, enum: ["pending", "processing", "paid", "failed"], default: "pending", index: true },
    method: { type: String, default: "bank_transfer" },
    reference: String,
    paidAt: Date,
    note: String,
  },
  { timestamps: true }
);

export const SellerPayout = model("SellerPayout", sellerPayoutSchema, "seller_payouts");
