import { Schema, model } from "mongoose";
import { oid } from "../../utils/mongo";

const userPhotoSchema = new Schema(
  {
    userId: { ...oid("User", true), index: true },
    url: { type: String, required: true },
    type: { type: String, enum: ["front", "side", "back", "full_body", "other"], default: "full_body" },
    mimeType: String,
    size: Number,
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const UserPhoto = model("UserPhoto", userPhotoSchema, "user_photos");
