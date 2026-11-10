import { Schema, model } from "mongoose";
import { oid } from "../../utils/mongo";

const productVariantSchema = new Schema(
  {
    productId: {
      ...oid("Product", true),
      index: true,
    },

    size: {
      type: String,
      default: "",
    },

    color: {
      type: String,
      default: "",
    },

    sku: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      min: 0,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ProductVariant = model(
  "ProductVariant",
  productVariantSchema,
  "product_variants"
);
