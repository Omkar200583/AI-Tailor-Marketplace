import { Router } from "express";
import { protect, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { aiLimiter } from "../../middleware/rateLimit";
import * as v from "../../validators/design.validator";
import * as c from "./design.controller";

const customer = authorize("user");

// mounted at /api/v1/ai/design
export const designRouter = Router();
designRouter.use(protect);
designRouter.post("/generate", customer, aiLimiter, validate({ body: v.generateDesignSchema }), c.generateDesign);
designRouter.get("/history", customer, c.designHistory);
designRouter.post("/save", customer, validate({ body: v.saveDesignSchema }), c.saveDesign);
designRouter.post("/:id/send-to-tailor", customer, validate({ body: v.sendToTailorSchema }), c.sendToTailor);
designRouter.delete("/:id", customer, c.deleteDesign);
designRouter.get("/:id", c.getDesign); // owner, design-request recipient or admin (checked in controller)

// mounted at /api/v1/design-requests
export const designRequestRouter = Router();
designRequestRouter.use(protect);
designRequestRouter.get("/", authorize("user", "seller", "designer"), c.listDesignRequests);
designRequestRouter.patch("/:id/respond", authorize("seller", "designer"), validate({ body: v.respondDesignRequestSchema }), c.respondDesignRequest);
