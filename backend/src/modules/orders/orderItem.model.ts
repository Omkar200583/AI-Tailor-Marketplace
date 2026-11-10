import { Schema, model } from "mongoose";
import { oid } from "../../utils/mongo";

const orderItemSchema = new Schema(
  {
    orderId: { ...oid("Order", true), index: true },
    productId: { ...oid("Product", true) },
    variantId: oid("ProductVariant"),
    designId: oid("Design"),
    name: { type: String, required: true },
    image: String,
    quantity: { type: Number, required: true, min: 1 },
    size: String,
    color: String,
    withStitching: { type: Boolean, default: true },
    customization: String,
    unitPrice: { type: Number, required: true },
    stitchingPrice: { type: Number, default: 0 },
    lineTotal: { type: Number, required: true },
  },
  { timestamps: true }
);

export const OrderItem = model("OrderItem", orderItemSchema, "order_items");
