import { Router } from "express";
import { protect, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import * as v from "../../validators/admin.validator";
import * as c from "./admin.controller";

// /api/v1/admin
export const adminRouter = Router();
adminRouter.use(protect, authorize("admin"));
adminRouter.get("/dashboard", c.adminDashboard);
adminRouter.get("/users", c.listUsers);
adminRouter.patch("/users/:id/status", validate({ body: v.userStatusSchema }), c.setUserStatus);
adminRouter.get("/sellers", c.listSellerProfiles);
adminRouter.patch("/sellers/:id/verify", validate({ body: v.verifySchema }), c.verifySeller);
adminRouter.get("/designers", c.listDesignerProfiles);
adminRouter.patch("/designers/:id/verify", validate({ body: v.verifySchema }), c.verifyDesigner);
adminRouter.get("/commissions", c.listCommissions);
adminRouter.get("/payouts", c.listPayouts);
adminRouter.post("/payouts", validate({ body: v.createPayoutSchema }), c.createPayout);
adminRouter.patch("/payouts/:id", validate({ body: v.updatePayoutSchema }), c.updatePayout);
adminRouter.get("/ai-usage", c.aiUsage);

// /api/v1/support
export const supportRouter = Router();
supportRouter.use(protect);
supportRouter.post("/tickets", validate({ body: v.ticketSchema }), c.createTicket);
supportRouter.get("/tickets", c.listTickets);
supportRouter.patch("/tickets/:id", validate({ body: v.ticketUpdateSchema }), c.updateTicket);

// /api/v1/analytics  (seller business statistics)
export const analyticsRouter = Router();
analyticsRouter.get("/seller", protect, authorize("seller"), c.sellerAnalytics);
analyticsRouter.get("/platform", protect, authorize("admin"), c.adminDashboard);

// /api/v1/seller/payouts  (seller views own settlements)
export const sellerPayoutRouter = Router();
sellerPayoutRouter.get("/payouts", protect, authorize("seller"), c.listPayouts);
