import { Schema, model } from "mongoose";
import { oid, geoPoint } from "../../utils/mongo";

const designerProfileSchema = new Schema(
  {
    userId: { ...oid("User", true), unique: true },
    displayName: { type: String, required: true, trim: true },
    bio: String,
    specialities: { type: [String], default: [] },
    portfolio: { type: [String], default: [] },
    experienceYears: Number,
    startingPrice: Number,
    contactNumber: String,
    location: geoPoint(false),
    city: String,
    rating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    verificationStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending", index: true },
    availability: { type: String, enum: ["available", "busy", "closed"], default: "available" },
  },
  { timestamps: true }
);
designerProfileSchema.index({ location: "2dsphere" }, { sparse: true });

export const DesignerProfile = model("DesignerProfile", designerProfileSchema, "designer_profiles");
