import { Schema, model } from "mongoose";
import { oid } from "../../utils/mongo";

const productImageSchema = new Schema(
  {
    productId: {
      ...oid("Product", true),
      index: true,
    },

    url: {
      type: String,
      required: true,
    },

    alt: {
      type: String,
      default: "",
    },

    color: {
      type: String,
      default: "",
    },

    isPrimary: {
      type: Boolean,
      default: false,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const ProductImage = model(
  "ProductImage",
  productImageSchema,
  "product_images"
);
