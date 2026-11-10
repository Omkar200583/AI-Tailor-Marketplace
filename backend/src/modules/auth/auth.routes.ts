import { Router } from "express";
import { validate } from "../../middleware/validate";
import { protect } from "../../middleware/auth";
import { authLimiter } from "../../middleware/rateLimit";
import * as v from "../../validators/auth.validator";
import * as c from "./auth.controller";

const router = Router();
router.use(authLimiter);

router.post("/register", validate({ body: v.registerSchema }), c.register);
router.post("/verify-otp", validate({ body: v.verifyOtpSchema }), c.verifyOtp);
router.post("/resend-otp", validate({ body: v.emailSchema }), c.resendOtp);
router.post("/login", validate({ body: v.loginSchema }), c.login);
router.post("/logout", c.logout);
router.post("/forgot-password", validate({ body: v.emailSchema }), c.forgotPassword);
router.post("/reset-password", validate({ body: v.resetPasswordSchema }), c.resetPassword);
router.post("/change-password", protect, validate({ body: v.changePasswordSchema }), c.changePassword);
router.get("/me", protect, c.me);

export default router;
