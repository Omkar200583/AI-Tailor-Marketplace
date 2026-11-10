import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/ApiResponse";
import { Product } from "../products/product.model";
import { Wishlist } from "../cart/wishlist.model";
import { OrderItem } from "../orders/orderItem.model";
import { Order } from "../orders/order.model";
import { SellerProfile } from "../sellers/sellerProfile.model";

// Lightweight rule-based suggestions (category affinity from wishlist + past orders).
// Swap the body for a call to ai-engine /recommendations when that service is ready.
export const recommendedProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(30, Number(req.query.limit) || 12);
  const userId = req.user!.id;

  const wishlist = await Wishlist.findOne({ userId }).lean();
  const orderIds = (await Order.find({ userId }).select("_id").limit(50).lean()).map((o) => o._id);
  const boughtIds = (await OrderItem.find({ orderId: { $in: orderIds } }).select("productId").lean()).map((i) => i.productId);
  const seedIds = [...(wishlist?.products || []), ...boughtIds];

  let categories: any[] = [];
  if (seedIds.length) {
    const seeds = await Product.find({ _id: { $in: seedIds } }).select("category").lean();
    categories = [...new Set(seeds.map((s) => String(s.category)))];
  }

  const personalised = categories.length
    ? await Product.find({ status: "active", category: { $in: categories }, _id: { $nin: seedIds } }).sort({ rating: -1, ratingCount: -1 }).limit(limit).lean()
    : [];
  const need = limit - personalised.length;
  const fill = need > 0
    ? await Product.find({ status: "active", _id: { $nin: [...seedIds, ...personalised.map((p) => p._id)] } }).sort({ rating: -1, createdAt: -1 }).limit(need).lean()
    : [];
  ok(res, [...personalised, ...fill]);
});

export const topSellers = asyncHandler(async (req, res) => {
  const items = await SellerProfile.find({ verificationStatus: "verified" })
    .sort({ rating: -1, ratingCount: -1 }).limit(Math.min(20, Number(req.query.limit) || 10)).populate("userId", "name profileImage");
  ok(res, items);
});

export const similarProducts = asyncHandler(async (req, res) => {
  const base = await Product.findById(req.params.id).lean();
  if (!base) return ok(res, []);
  const items = await Product.find({ status: "active", _id: { $ne: base._id }, category: base.category })
    .sort({ rating: -1 }).limit(8).lean();
  ok(res, items);
});
