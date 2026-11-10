import { z } from "zod";

export const designerProfileSchema = z.object({
  displayName: z.string().min(2).max(120),
  bio: z.string().max(1500).optional(),
  specialities: z.array(z.string()).optional(),
  portfolio: z.array(z.string()).optional(),
  experienceYears: z.number().min(0).max(80).optional(),
  startingPrice: z.number().min(0).optional(),
  contactNumber: z.string().min(8).max(15).optional(),
  city: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  availability: z.enum(["available", "busy", "closed"]).optional(),
});
