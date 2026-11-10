import { z } from "zod";

export const verifySchema = z.object({ status: z.enum(["verified", "rejected", "pending"]), note: z.string().max(500).optional() });
export const userStatusSchema = z.object({ isActive: z.boolean() });
export const createPayoutSchema = z.object({ sellerId: z.string().length(24), note: z.string().optional() });
export const updatePayoutSchema = z.object({ status: z.enum(["processing", "paid", "failed"]), reference: z.string().optional() });
export const ticketSchema = z.object({
  subject: z.string().min(3).max(200),
  description: z.string().min(5).max(4000),
  category: z.enum(["order", "payment", "account", "ai", "other"]).default("other"),
  orderId: z.string().length(24).optional(),
});
export const ticketUpdateSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  response: z.string().max(2000).optional(),
});
