import { z } from "zod";

export const shopSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  logo: z.string().optional(),
  banner: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().min(5),
  city: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  openingHours: z.string().optional(),
  isActive: z.boolean().optional(),
});
