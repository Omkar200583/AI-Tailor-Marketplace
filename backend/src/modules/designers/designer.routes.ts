import { Router } from "express";
import { protect, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { designerProfileSchema } from "../../validators/designer.validator";
import * as c from "./designer.controller";

const router = Router();
router.get("/", c.listDesigners);
router.post("/me", protect, authorize("designer"), validate({ body: designerProfileSchema }), c.createMyProfile);
router.get("/me", protect, authorize("designer"), c.getMyProfile);
router.put("/me", protect, authorize("designer"), validate({ body: designerProfileSchema.partial() }), c.updateMyProfile);
router.get("/:id", c.getDesigner);
export default router;
