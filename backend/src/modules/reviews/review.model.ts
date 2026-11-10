import { Schema, model } from "mongoose";
import { oid } from "../../utils/mongo";

const reviewSchema = new Schema(
  {
    userId: { ...oid("User", true), index: true },
    targetType: { type: String, enum: ["seller", "designer", "product"], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    orderId: oid("Order"),
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 2000 },
    images: [String],
    reply: { text: String, at: Date },
  },
  { timestamps: true }
);
reviewSchema.index({ userId: 1, targetType: 1, targetId: 1, orderId: 1 }, { unique: true });

export const Review = model("Review", reviewSchema);
