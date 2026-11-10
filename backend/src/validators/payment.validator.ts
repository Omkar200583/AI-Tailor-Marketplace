import { z } from "zod";

export const createPaymentOrderSchema = z.object({ orderId: z.string().length(24) });
export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});
