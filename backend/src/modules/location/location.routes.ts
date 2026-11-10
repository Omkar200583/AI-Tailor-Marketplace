import { Router } from "express";
import { protect } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { nearbyQuerySchema, saveLocationSchema } from "../../validators/location.validator";
import * as c from "./location.controller";

const router = Router();
router.post("/location", protect, validate({ body: saveLocationSchema }), c.saveLocation);
router.get("/tailors/nearby", validate({ query: nearbyQuerySchema }), c.nearbyTailors);
router.get("/designers/nearby", validate({ query: nearbyQuerySchema }), c.nearbyDesigners);
router.get("/shops/nearby", validate({ query: nearbyQuerySchema }), c.nearbyShops);
export default router;
