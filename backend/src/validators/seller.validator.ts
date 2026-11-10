import { z } from "zod";

export const sellerProfileSchema = z.object({
  shopName: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  contactNumber: z.string().min(8).max(15),
  whatsappNumber: z.string().min(8).max(15).optional(),
  address: z.string().min(5),
  city: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  services: z.array(z.string()).optional(),
  experienceYears: z.number().min(0).max(80).optional(),
  portfolio: z.array(z.string()).optional(),
  availability: z.enum(["available", "busy", "closed"]).optional(),
});

export const approveSchema = z.object({
  note: z.string().max(500).optional(),
  estimatedDeliveryDays: z.number().int().min(1).max(120).optional(),
  deliveryFee: z.number().min(0).optional(),
});
export const rejectSchema = z.object({ note: z.string().min(3).max(500) });
export const orderStatusSchema = z.object({ status: z.enum(["stitching", "ready", "shipped", "delivered"]), note: z.string().optional() });
