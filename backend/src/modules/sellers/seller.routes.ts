import { Router } from "express";
import { protect, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { sellerProfileSchema } from "../../validators/seller.validator";
import * as c from "./seller.controller";

const router = Router();

router.get("/", c.listSellers);
router.post("/me", protect, authorize("seller"), validate({ body: sellerProfileSchema }), c.createMyProfile);
router.get("/me", protect, authorize("seller"), c.getMyProfile);
router.put("/me", protect, authorize("seller"), validate({ body: sellerProfileSchema.partial() }), c.updateMyProfile);
router.get("/:id", c.getSeller);

export default router;
