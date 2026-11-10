import { z } from "zod";

export const createSessionSchema = z
  .object({
    photoId: z.string().length(24),
    productId: z.string().length(24).optional(),
    designId: z.string().length(24).optional(),
  })
  .refine((v) => !!v.productId !== !!v.designId, { message: "Provide exactly one of productId or designId" });

export const generateTryonSchema = z.object({ sessionId: z.string().length(24) });
