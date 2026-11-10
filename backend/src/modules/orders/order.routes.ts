import { Router } from "express";
import { protect, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { createOrderSchema } from "../../validators/order.validator";
import { approveSchema, orderStatusSchema, rejectSchema } from "../../validators/seller.validator";
import * as c from "./order.controller";

export const orderRouter = Router();
orderRouter.use(protect);
orderRouter.post("/", authorize("user"), validate({ body: createOrderSchema }), c.createOrder);
orderRouter.get("/", authorize("user", "seller"), c.listOrders);
orderRouter.get("/:id", c.getOrder);
orderRouter.patch("/:id/cancel", authorize("user"), c.cancelOrder);

// Seller approval flow  ->  /api/v1/seller/...
export const sellerOrderRouter = Router();
sellerOrderRouter.use(protect, authorize("seller"));
sellerOrderRouter.get("/requests", c.sellerRequests);
sellerOrderRouter.patch("/requests/:id/approve", validate({ body: approveSchema }), c.approveRequest);
sellerOrderRouter.patch("/requests/:id/reject", validate({ body: rejectSchema }), c.rejectRequest);
sellerOrderRouter.patch("/orders/:id/status", validate({ body: orderStatusSchema }), c.updateOrderStatus);
