import { z } from "zod";

export const createOrderSchema = z.object({
  addressId: z.string().length(24),
  useBodyProfile: z.boolean().default(true),
  notes: z.string().max(1000).optional(),
});
