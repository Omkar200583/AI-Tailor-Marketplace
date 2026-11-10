import { Router } from "express";
import { protect } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { bodyProfileSchema } from "../../validators/measurement.validator";
import * as c from "./measurement.controller";

const router = Router();
router.use(protect);
router.get("/me", c.getMyMeasurements);
router.put("/me", validate({ body: bodyProfileSchema }), c.upsertMyMeasurements);
router.delete("/me", c.deleteMyMeasurements);
router.get("/required/:categoryId", c.requiredForCategory);
export default router;
