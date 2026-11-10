import { Schema, model } from "mongoose";
import { oid, geoPoint } from "../../utils/mongo";

const shopSchema = new Schema(
  {
    sellerId: { ...oid("User", true), index: true },
    name: { type: String, required: true, trim: true },
    description: String,
    logo: String,
    banner: String,
    phone: String,
    address: { type: String, required: true },
    city: { type: String, index: true },
    location: geoPoint(true),
    openingHours: { type: String, default: "10:00 - 20:00" },
    isActive: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);
shopSchema.index({ location: "2dsphere" });

export const Shop = model("Shop", shopSchema);
