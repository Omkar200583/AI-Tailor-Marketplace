import { Router } from "express";
import { protect, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";

import {
  productQuerySchema,
  productSchema,
  productUpdateSchema,
} from "../../validators/product.validator";

import * as controller from "./product.controller";

const router = Router();

router.get(
  "/",
  validate({ query: productQuerySchema }),
  controller.listProducts
);

router.get(
  "/search",
  validate({ query: productQuerySchema }),
  controller.listProducts
);

router.get(
  "/mine",
  protect,
  authorize("seller"),
  controller.myProducts
);

router.get("/:id", controller.getProduct);

router.post(
  "/",
  protect,
  authorize("seller"),
  validate({ body: productSchema }),
  controller.createProduct
);

router.put(
  "/:id",
  protect,
  authorize("seller"),
  validate({ body: productUpdateSchema }),
  controller.updateProduct
);

router.delete(
  "/:id",
  protect,
  authorize("seller", "admin"),
  controller.deleteProduct
);

export default router;
