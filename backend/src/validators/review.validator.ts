import { z } from "zod";

export const createReviewSchema = z.object({
  targetType: z.enum(["seller", "designer", "product"]),
  targetId: z.string().length(24),
  orderId: z.string().length(24).optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  images: z.array(z.string()).max(5).optional(),
});
export const replySchema = z.object({ text: z.string().min(1).max(1000) });
