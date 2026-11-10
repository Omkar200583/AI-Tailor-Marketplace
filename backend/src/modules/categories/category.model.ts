import { Schema, model } from "mongoose";
import { oid } from "../../utils/mongo";

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: String,
    image: String,
    parentId: oid("Category"),
    gender: { type: String, enum: ["men", "women", "kids", "unisex"], default: "unisex" },
    // body measurement keys needed to stitch this category (height, chest, waist, hip, shoulder, sleeveLength)
    measurementFields: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Category = model("Category", categorySchema);
