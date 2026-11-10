import { Schema, model } from "mongoose";
import { oid, geoPoint } from "../../utils/mongo";

const addressSchema = new Schema(
  {
    userId: { ...oid("User", true), index: true },
    label: { type: String, default: "Home" },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },
    isDefault: { type: Boolean, default: false },
    location: geoPoint(false),
  },
  { timestamps: true }
);

export const Address = model("Address", addressSchema);
