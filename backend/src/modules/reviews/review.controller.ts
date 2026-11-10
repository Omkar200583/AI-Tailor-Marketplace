import { Types } from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { getPagination, pageMeta } from "../../utils/pagination";
import { Review } from "./review.model";
import { Order } from "../orders/order.model";
import { OrderItem } from "../orders/orderItem.model";
import { Product } from "../products/product.model";
import { SellerProfile } from "../sellers/sellerProfile.model";
import { DesignerProfile } from "../designers/designerProfile.model";
import { notify } from "../notifications/notification.service";

const modelFor = (t: string): any => (t === "seller" ? SellerProfile : t === "designer" ? DesignerProfile : Product);

const recompute = async (targetType: string, targetId: any) => {
  const [agg] = await Review.aggregate([
    { $match: { targetType, targetId: new Types.ObjectId(String(targetId)) } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  await modelFor(targetType).findByIdAndUpdate(targetId, { rating: agg ? Math.round(agg.avg * 10) / 10 : 0, ratingCount: agg?.count || 0 });
};

export const createReview = asyncHandler(async (req, res) => {
  const { targetType, targetId, orderId, ...rest } = req.body;
  const userId = req.user!.id;
  const target = await modelFor(targetType).findById(targetId);
  if (!target) throw ApiError.notFound("Review target not found");

  // Only customers with a delivered order can review sellers/products
  if (targetType !== "designer") {
    if (!orderId) throw ApiError.badRequest("orderId is required to review a seller or product");
    const order = await Order.findOne({ _id: orderId, userId, status: "delivered" });
    if (!order) throw ApiError.forbidden("You can only review after the order is delivered");
    if (targetType === "seller" && String(order.sellerId) !== String(target.userId)) throw ApiError.badRequest("This seller is not part of that order");
    if (targetType === "product" && !(await OrderItem.exists({ orderId, productId: targetId }))) throw ApiError.badRequest("This product is not part of that order");
  }

  const review = await Review.create({ ...rest, targetType, targetId, orderId, userId });
  await recompute(targetType, targetId);
  const notifyUser = targetType === "product" ? target.sellerId : target.userId;
  await notify({ userId: String(notifyUser), type: "review", title: "New review", message: `You received a ${rest.rating}-star review`, data: { reviewId: review.id } });
  created(res, review, "Review submitted");
});

export const listReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { targetType: req.params.targetType, targetId: req.params.targetId };
  const [items, total] = await Promise.all([
    Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("userId", "name profileImage"),
    Review.countDocuments(filter),
  ]);
  ok(res, items, "Success", 200, pageMeta(total, page, limit));
});

export const deleteReview = asyncHandler(async (req, res) => {
  const filter: any = { _id: req.params.id };
  if (req.user!.role !== "admin") filter.userId = req.user!.id;
  const review = await Review.findOneAndDelete(filter);
  if (!review) throw ApiError.notFound("Review not found");
  await recompute(review.targetType, review.targetId);
  ok(res, null, "Review deleted");
});

export const replyToReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound("Review not found");
  const target = await modelFor(review.targetType).findById(review.targetId);
  const ownerId = review.targetType === "product" ? target?.sellerId : target?.userId;
  if (!target || String(ownerId) !== req.user!.id) throw ApiError.forbidden("Only the reviewed seller/designer can reply");
  review.reply = { text: req.body.text, at: new Date() } as any;
  await review.save();
  ok(res, review, "Reply added");
});
