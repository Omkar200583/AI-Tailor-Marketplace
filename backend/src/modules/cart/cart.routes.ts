import { Router } from "express";
import { protect, authorize } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { addToCartSchema, updateCartSchema } from "../../validators/cart.validator";
import * as c from "./cart.controller";

export const cartRouter = Router();
cartRouter.use(protect, authorize("user"));
cartRouter.post("/add", validate({ body: addToCartSchema }), c.addToCart);
cartRouter.get("/", c.getCart);
cartRouter.put("/update", validate({ body: updateCartSchema }), c.updateCartItem);
cartRouter.delete("/", c.clearCart);
cartRouter.delete("/:id", c.removeCartItem);

export const wishlistRouter = Router();
wishlistRouter.use(protect, authorize("user"));
wishlistRouter.get("/", c.getWishlist);
wishlistRouter.post("/:productId", c.toggleWishlist);
wishlistRouter.delete("/:productId", c.removeFromWishlist);
