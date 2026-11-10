import { Schema, model } from "mongoose";
import { oid } from "../../utils/mongo";

const wishlistSchema = new Schema(
  { userId: { ...oid("User", true), unique: true }, products: [oid("Product")] },
  { timestamps: true }
);

export const Wishlist = model("Wishlist", wishlistSchema);
