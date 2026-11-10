import { Schema, model } from "mongoose";
import { oid } from "../../utils/mongo";

const cartItemSchema = new Schema({
  productId: { ...oid("Product", true) },
  variantId: oid("ProductVariant"),
  sellerId: { ...oid("User", true) },
  quantity: { type: Number, default: 1, min: 1, max: 20 },
  size: String,
  color: String,
  withStitching: { type: Boolean, default: true },
  customization: String,
  designId: oid("Design"),
});

const cartSchema = new Schema(
  { userId: { ...oid("User", true), unique: true }, items: [cartItemSchema] },
  { timestamps: true }
);

export const Cart = model("Cart", cartSchema);
