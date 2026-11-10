import { Router } from "express";
import { protect, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { createReviewSchema, replySchema } from "../../validators/review.validator";
import * as c from "./review.controller";

const router = Router();
router.get("/:targetType(seller|designer|product)/:targetId", c.listReviews);
router.post("/", protect, authorize("user"), validate({ body: createReviewSchema }), c.createReview);
router.post("/:id/reply", protect, authorize("seller", "designer"), validate({ body: replySchema }), c.replyToReview);
router.delete("/:id", protect, c.deleteReview);
export default router;
