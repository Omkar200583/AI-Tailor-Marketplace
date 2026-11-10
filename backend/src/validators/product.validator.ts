import { z } from "zod";

const variantSchema = z.object({
  size: z.string().optional(),
  color: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().min(0).optional(),
  stock: z.number().int().min(0).default(0),
});

export const productSchema = z.object({
  shopId: z.string().length(24),

  name: z.string().min(2).max(160),

  description: z.string().max(4000).optional(),

  category: z.string().min(2).max(100),

  images: z.array(z.string().url()).max(10).optional().default([]),

  fabric: z.string().optional(),

  colors: z.array(z.string()).optional().default([]),

  sizes: z.array(z.string()).optional().default([]),

  price: z.coerce.number().min(0),

  stitchingPrice: z.coerce.number().min(0).optional().default(0),

  stock: z.coerce.number().int().min(0).optional().default(10),

  customizationAvailable: z.boolean().optional().default(false),

  deliveryDays: z.coerce.number().int().min(0).max(180).optional().default(7),

  tags: z.array(z.string()).optional().default([]),

  status: z.enum(["draft", "active", "inactive"]).optional().default("active"),

  variants: z.array(variantSchema).optional().default([]),
});

export const productUpdateSchema = productSchema.partial();

export const productQuerySchema = z.object({
  q: z.string().optional(),

  category: z.string().optional(),

  shopId: z.string().optional(),

  sellerId: z.string().optional(),

  minPrice: z.coerce.number().optional(),

  maxPrice: z.coerce.number().optional(),

  fabric: z.string().optional(),

  customizable: z.enum(["true", "false"]).optional(),

  sort: z.enum([
    "newest",
    "price_asc",
    "price_desc",
    "rating",
    "relevance",
  ]).optional(),

  page: z.coerce.number().int().min(1).optional(),

  limit: z.coerce.number().int().min(1).max(100).optional(),
});
