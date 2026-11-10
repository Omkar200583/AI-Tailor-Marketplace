import { z } from "zod";

export const generateDesignSchema = z.object({
  prompt: z.string().min(5).max(1000),
  category: z.string().length(24).optional(),
  style: z.string().max(100).optional(),
  gender: z.enum(["men", "women", "kids", "unisex"]).optional(),
  colors: z.array(z.string()).max(5).optional(),
  fabric: z.string().max(100).optional(),
  numImages: z.number().int().min(1).max(4).default(2),
});

export const saveDesignSchema = z.object({ designId: z.string().length(24), title: z.string().max(120).optional() });

export const sendToTailorSchema = z.object({
  recipientId: z.string().length(24),
  recipientType: z.enum(["seller", "designer"]),
  message: z.string().max(1000).optional(),
  budget: z.number().min(0).optional(),
  useBodyProfile: z.boolean().default(true),
});

export const respondDesignRequestSchema = z.object({
  action: z.enum(["accept", "reject"]),
  amount: z.number().min(0).optional(),
  deliveryDays: z.number().int().min(1).max(180).optional(),
  note: z.string().max(1000).optional(),
});
