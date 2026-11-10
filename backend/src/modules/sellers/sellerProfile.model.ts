import { Schema, model } from "mongoose";
import { oid, geoPoint } from "../../utils/mongo";

const sellerProfileSchema = new Schema(
  {
    userId: { ...oid("User", true), unique: true },
    shopName: { type: String, required: true, trim: true },
    description: String,
    contactNumber: { type: String, required: true },
    whatsappNumber: String,
    location: geoPoint(true),
    address: { type: String, required: true },
    city: { type: String, index: true },
    services: { type: [String], default: [] },
    experienceYears: Number,
    portfolio: { type: [String], default: [] },
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    verificationStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending", index: true },
    verificationNote: String,
    availability: { type: String, enum: ["available", "busy", "closed"], default: "available" },
  },
  { timestamps: true }
);
sellerProfileSchema.index({ location: "2dsphere" });

export const SellerProfile = model("SellerProfile", sellerProfileSchema, "seller_profiles");
