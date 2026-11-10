import { Schema, model } from "mongoose";
import { oid } from "../../utils/mongo";

const productSchema = new Schema(
  {
    sellerId: {
      ...oid("User", true),
      index: true,
    },

    shopId: {
      ...oid("Shop", true),
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    category: {
      ...oid("Category", true),
      index: true,
    },

    images: {
      type: [String],
      default: [],
    },

    fabric: {
      type: String,
      default: "Cotton",
    },

    colors: {
      type: [String],
      default: [],
    },

    sizes: {
      type: [String],
      default: [],
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    stitchingPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    stock: {
      type: Number,
      default: 10,
      min: 0,
    },

    customizationAvailable: {
      type: Boolean,
      default: false,
    },

    deliveryDays: {
      type: Number,
      default: 7,
      min: 0,
    },

    tags: {
      type: [String],
      default: [],
    },

    rating: {
      type: Number,
      default: 0,
    },

    ratingCount: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["draft", "active", "inactive"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({
  name: "text",
  description: "text",
  tags: "text",
  fabric: "text",
});

export const Product = model("Product", productSchema);
