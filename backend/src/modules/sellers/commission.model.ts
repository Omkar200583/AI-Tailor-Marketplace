import { Schema, model } from "mongoose";
import { oid } from "../../utils/mongo";

const commissionSchema = new Schema(
  {
    orderId: { ...oid("Order", true), unique: true },
    sellerId: { ...oid("User", true), index: true },
    orderAmount: { type: Number, required: true },
    rate: { type: Number, required: true }, // percent
    commissionAmount: { type: Number, required: true },
    sellerAmount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "settled", "refunded"], default: "pending", index: true },
    payoutId: oid("SellerPayout"),
  },
  { timestamps: true }
);

export const Commission = model("Commission", commissionSchema);
