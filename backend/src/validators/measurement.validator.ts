import { z } from "zod";

const m = z.number().positive().max(500).optional();
export const bodyProfileSchema = z.object({
  unit: z.enum(["cm", "inch"]).optional(),
  height: m, chest: m, waist: m, hip: m, shoulder: m, sleeveLength: m, neck: m, inseam: m, thigh: m,
  notes: z.string().max(500).optional(),
});
