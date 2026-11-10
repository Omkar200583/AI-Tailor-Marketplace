import { Schema, model } from "mongoose";
import { oid } from "../../utils/mongo";

const tryonSessionSchema = new Schema(
  {
    userId: { ...oid("User", true), index: true },
    photoId: { ...oid("UserPhoto", true) },
    productId: oid("Product"),
    designId: oid("Design"),
    garmentImage: { type: String, required: true },
    resultImages: { type: [String], default: [] },
    status: { type: String, enum: ["created", "processing", "completed", "failed"], default: "created", index: true },
    error: String,
    aiMeta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const TryonSession = model("TryonSession", tryonSessionSchema, "tryon_sessions");
