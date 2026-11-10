import { Schema, model } from "mongoose";
import { oid } from "../../utils/mongo";

const designSchema = new Schema(
  {
    userId: { ...oid("User", true), index: true },
    prompt: { type: String, required: true },
    enhancedPrompt: String,
    category: oid("Category"),
    style: String,
    gender: { type: String, enum: ["men", "women", "kids", "unisex"] },
    colors: [String],
    fabric: String,
    images: { type: [String], default: [] },
    status: { type: String, enum: ["generated", "failed"], default: "generated" },
    isSaved: { type: Boolean, default: false, index: true },
    title: String,
    aiMeta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Design = model("Design", designSchema, "designs");
