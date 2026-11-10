import { Router } from "express";
import { protect, authorize } from "../../middleware/auth";
import * as c from "./recommendation.controller";

const router = Router();
router.get("/products", protect, authorize("user"), c.recommendedProducts);
router.get("/sellers", c.topSellers);
router.get("/similar/:id", c.similarProducts);
export default router;
