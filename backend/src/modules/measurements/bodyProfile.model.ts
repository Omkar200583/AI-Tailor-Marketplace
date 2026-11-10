import { Schema, model } from "mongoose";
import { oid } from "../../utils/mongo";

const m = { type: Number, min: 0 };

const bodyProfileSchema = new Schema(
  {
    userId: { ...oid("User", true), unique: true },
    unit: { type: String, enum: ["cm", "inch"], default: "cm" },
    // all optional — each garment needs a different subset
    height: m, chest: m, waist: m, hip: m, shoulder: m, sleeveLength: m, neck: m, inseam: m, thigh: m,
    notes: String,
  },
  { timestamps: true }
);

export const BodyProfile = model("BodyProfile", bodyProfileSchema, "body_profiles");
