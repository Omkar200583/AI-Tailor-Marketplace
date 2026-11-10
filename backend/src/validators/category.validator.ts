import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  image: z.string().optional(),
  parentId: z.string().optional(),
  gender: z.enum(["men", "women", "kids", "unisex"]).optional(),
  measurementFields: z.array(z.enum(["height", "chest", "waist", "hip", "shoulder", "sleeveLength", "neck", "inseam", "thigh"])).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});
