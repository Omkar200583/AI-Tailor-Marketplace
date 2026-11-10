import { Router } from "express";
import { protect, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { shopSchema } from "../../validators/shop.validator";
import * as c from "./shop.controller";

const router = Router();
router.get("/", c.listShops);
router.get("/mine", protect, authorize("seller"), c.myShops);
router.get("/:id", c.getShop);
router.post("/", protect, authorize("seller"), validate({ body: shopSchema }), c.createShop);
router.put("/:id", protect, authorize("seller"), validate({ body: shopSchema.partial() }), c.updateShop);
router.delete("/:id", protect, authorize("seller"), c.deleteShop);
export default router;
