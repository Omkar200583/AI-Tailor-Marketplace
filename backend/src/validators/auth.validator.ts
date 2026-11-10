import { z } from "zod";

const password = z.string().min(8, "Password must be at least 8 characters").max(72);

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(8).max(15).optional(),
  password,
  role: z.enum(["user", "seller", "designer"]).default("user"),
});

export const loginSchema = z.object({
  identifier: z.string().min(3), // email or phone
  password: z.string().min(1),
});

export const verifyOtpSchema = z.object({ email: z.string().email(), otp: z.string().length(6) });
export const emailSchema = z.object({ email: z.string().email() });
export const resetPasswordSchema = z.object({ email: z.string().email(), otp: z.string().length(6), newPassword: password });
export const changePasswordSchema = z.object({ currentPassword: z.string(), newPassword: password });
