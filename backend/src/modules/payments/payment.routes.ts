import { Router } from "express";
import { protect, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { createPaymentOrderSchema, verifyPaymentSchema } from "../../validators/payment.validator";
import * as c from "./payment.controller";

const router = Router();
router.post("/webhook", c.webhook); // public, signature-verified
router.use(protect);
router.post("/create-order", authorize("user"), validate({ body: createPaymentOrderSchema }), c.createPaymentOrder);
router.post("/verify", authorize("user"), validate({ body: verifyPaymentSchema }), c.verifyPayment);
router.get("/history", c.paymentHistory);
export default router;
