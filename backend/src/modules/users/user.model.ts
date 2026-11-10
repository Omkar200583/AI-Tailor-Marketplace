import { Schema, model, InferSchemaType } from "mongoose";
import { geoPoint } from "../../utils/mongo";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, unique: true, sparse: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["user", "seller", "designer", "admin"], default: "user", index: true },
    profileImage: { type: String },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    otpHash: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    otpPurpose: { type: String, enum: ["verify", "reset"], select: false },
    lastLoginAt: { type: Date },
    lastLocation: geoPoint(false),
  },
  { timestamps: true }
);
userSchema.index({ lastLocation: "2dsphere" }, { sparse: true });

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
