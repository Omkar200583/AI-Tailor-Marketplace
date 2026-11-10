import { z } from "zod";

export const createConversationSchema = z.object({
  participantId: z.string().length(24),
  orderId: z.string().length(24).optional(),
  designRequestId: z.string().length(24).optional(),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().length(24),
  text: z.string().max(4000).optional(),
  attachments: z.array(z.object({ url: z.string(), type: z.enum(["image", "design", "file"]).default("image") })).max(5).optional(),
});
