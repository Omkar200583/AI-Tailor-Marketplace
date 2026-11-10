import { Schema, model } from "mongoose";
import { oid } from "../../utils/mongo";

const designRequestSchema = new Schema(
  {
    designId: { ...oid("Design", true), index: true },
    userId: { ...oid("User", true), index: true },
    recipientId: { ...oid("User", true), index: true }, // seller or designer user id
    recipientType: { type: String, enum: ["seller", "designer"], required: true },
    message: String,
    budget: Number,
    measurements: { type: Schema.Types.Mixed },
    status: { type: String, enum: ["pending", "accepted", "rejected", "completed"], default: "pending", index: true },
    quote: { amount: Number, deliveryDays: Number, note: String },
    respondedAt: Date,
  },
  { timestamps: true }
);

export const DesignRequest = model("DesignRequest", designRequestSchema, "design_requests");
