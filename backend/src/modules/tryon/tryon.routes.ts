import { Router } from "express";
import { protect, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { aiLimiter } from "../../middleware/rateLimit";
import { createSessionSchema, generateTryonSchema } from "../../validators/tryon.validator";
import * as c from "./tryon.controller";

const router = Router();
router.use(protect, authorize("user"));
router.get("/", c.listSessions);
router.post("/sessions", validate({ body: createSessionSchema }), c.createSession);
router.post("/generate", aiLimiter, validate({ body: generateTryonSchema }), c.generateTryon);
router.get("/:id", c.getSession);
router.delete("/:id", c.deleteSession);
export default router;
