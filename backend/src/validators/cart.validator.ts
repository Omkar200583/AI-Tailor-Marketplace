import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().length(24),
  variantId: z.string().length(24).optional(),
  quantity: z.number().int().min(1).max(20).default(1),
  size: z.string().optional(),
  color: z.string().optional(),
  withStitching: z.boolean().optional(),
  customization: z.string().max(1000).optional(),
  designId: z.string().length(24).optional(),
});

export const updateCartSchema = z.object({
  itemId: z.string().length(24),
  quantity: z.number().int().min(1).max(20).optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  withStitching: z.boolean().optional(),
  customization: z.string().max(1000).optional(),
});
