import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { Cart } from "./cart.model";
import { Wishlist } from "./wishlist.model";
import { Product } from "../products/product.model";

const populated = (userId: string) =>
  Cart.findOne({ userId }).populate("items.productId", "name images price stitchingPrice deliveryDays status").populate("items.variantId");

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, variantId, quantity, size, color, withStitching, customization, designId } = req.body;
  const product = await Product.findOne({ _id: productId, status: "active" });
  if (!product) throw ApiError.notFound("Product not available");
  const cart = (await Cart.findOne({ userId: req.user!.id })) || new Cart({ userId: req.user!.id, items: [] });
  const existing = cart.items.find(
    (i: any) => String(i.productId) === productId && String(i.variantId || "") === (variantId || "") && i.size === size && i.color === color && !designId && !customization
  );
  if (existing) existing.quantity = Math.min(20, existing.quantity + quantity);
  else cart.items.push({ productId, variantId, sellerId: product.sellerId, quantity, size, color, withStitching: withStitching ?? true, customization, designId } as any);
  await cart.save();
  ok(res, await populated(req.user!.id), "Added to cart", 201);
});

export const getCart = asyncHandler(async (req, res) => {
  ok(res, (await populated(req.user!.id)) || { items: [] });
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const { itemId, ...changes } = req.body;
  const cart = await Cart.findOne({ userId: req.user!.id });
  const item: any = cart?.items.find((i: any) => String(i._id) === itemId);
  if (!cart || !item) throw ApiError.notFound("Cart item not found");
  Object.assign(item, changes);
  await cart.save();
  ok(res, await populated(req.user!.id), "Cart updated");
});

export const removeCartItem = asyncHandler(async (req, res) => {
  await Cart.updateOne({ userId: req.user!.id }, { $pull: { items: { _id: req.params.id } } });
  ok(res, await populated(req.user!.id), "Item removed");
});

export const clearCart = asyncHandler(async (req, res) => {
  await Cart.updateOne({ userId: req.user!.id }, { $set: { items: [] } });
  ok(res, null, "Cart cleared");
});

// ---- Wishlist ----
export const getWishlist = asyncHandler(async (req, res) => {
  const w = await Wishlist.findOne({ userId: req.user!.id }).populate("products", "name images price rating status");
  ok(res, w?.products || []);
});

export const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (!(await Product.exists({ _id: productId }))) throw ApiError.notFound("Product not found");
  const w = (await Wishlist.findOne({ userId: req.user!.id })) || new Wishlist({ userId: req.user!.id, products: [] });
  const idx = w.products.findIndex((p: any) => String(p) === productId);
  if (idx >= 0) w.products.splice(idx, 1); else w.products.push(productId as any);
  await w.save();
  ok(res, { wishlisted: idx < 0, count: w.products.length }, idx < 0 ? "Added to wishlist" : "Removed from wishlist");
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  await Wishlist.updateOne({ userId: req.user!.id }, { $pull: { products: req.params.productId } });
  ok(res, null, "Removed from wishlist");
});
