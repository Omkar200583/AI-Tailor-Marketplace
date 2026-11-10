import crypto from "crypto";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { getPagination, pageMeta } from "../../utils/pagination";
import { Order } from "./order.model";
import { OrderItem } from "./orderItem.model";
import { OrderApproval } from "./orderApproval.model";
import { Cart } from "../cart/cart.model";
import { Product } from "../products/product.model";
import { ProductVariant } from "../products/productVariant.model";
import { Address } from "../users/address.model";
import { BodyProfile } from "../measurements/bodyProfile.model";
import { notify } from "../notifications/notification.service";
import { Commission } from "../sellers/commission.model";

const orderNumber = () => `AT${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
const round2 = (n: number) => Math.round(n * 100) / 100;

// One order is created per seller, each needs that tailor's approval before payment.
export const createOrder = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const cart = await Cart.findOne({ userId });
  if (!cart || !cart.items.length) throw ApiError.badRequest("Your cart is empty");

  const address = await Address.findOne({ _id: req.body.addressId, userId }).lean();
  if (!address) throw ApiError.notFound("Address not found");
  const body = req.body.useBodyProfile ? await BodyProfile.findOne({ userId }).lean() : null;

  const products = await Product.find({ _id: { $in: cart.items.map((i: any) => i.productId) }, status: "active" });
  const productMap = new Map(products.map((p) => [p.id, p]));
  const variants = await ProductVariant.find({ _id: { $in: cart.items.map((i: any) => i.variantId).filter(Boolean) } });
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  const groups = new Map<string, any[]>();
  for (const item of cart.items as any[]) {
    const product = productMap.get(String(item.productId));
    if (!product) throw ApiError.badRequest("A product in your cart is no longer available");
    const variant = item.variantId ? variantMap.get(String(item.variantId)) : undefined;
    if (variant && variant.stock < item.quantity && variant.stock !== 0) throw ApiError.badRequest(`Insufficient stock for ${product.name}`);
    const unitPrice = variant?.price ?? product.price;
    const stitchingPrice = item.withStitching ? product.stitchingPrice || 0 : 0;
    const line = {
      productId: product._id, variantId: item.variantId, designId: item.designId, name: product.name, image: product.images?.[0],
      quantity: item.quantity, size: item.size, color: item.color, withStitching: item.withStitching, customization: item.customization,
      unitPrice, stitchingPrice, lineTotal: round2((unitPrice + stitchingPrice) * item.quantity),
      _delivery: product.deliveryDays, _shop: product.shopId,
    };
    const key = String(product.sellerId);
    groups.set(key, [...(groups.get(key) || []), line]);
  }

  const orders = [];
  for (const [sellerId, lines] of groups) {
    const subtotal = round2(lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0));
    const stitchingTotal = round2(lines.reduce((s, l) => s + l.stitchingPrice * l.quantity, 0));
    const order = await Order.create({
      orderNumber: orderNumber(), userId, sellerId, shopId: lines[0]._shop, shippingAddress: address, measurements: body || undefined,
      subtotal, stitchingTotal, deliveryFee: 0, total: round2(subtotal + stitchingTotal),
      estimatedDeliveryDays: Math.max(...lines.map((l) => l._delivery || 0)), notes: req.body.notes,
      statusHistory: [{ status: "pending_approval", note: "Order placed, waiting for tailor approval" }],
    });
    await OrderItem.insertMany(lines.map(({ _delivery, _shop, ...l }) => ({ ...l, orderId: order._id })));
    await OrderApproval.create({ orderId: order._id, sellerId, userId });
    await notify({ userId: sellerId, type: "approval", title: "New order request", message: `Order ${order.orderNumber} is waiting for your approval`, data: { orderId: order.id } });
    orders.push(order);
  }

  cart.items.splice(0, cart.items.length);
  await cart.save();
  created(res, orders, "Order request sent to tailor(s) for approval");
});

export const listOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter: any = req.user!.role === "seller" ? { sellerId: req.user!.id } : { userId: req.user!.id };
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("sellerId", "name").populate("shopId", "name"),
    Order.countDocuments(filter),
  ]);
  ok(res, items, "Success", 200, pageMeta(total, page, limit));
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("userId", "name phone profileImage").populate("sellerId", "name phone").populate("shopId", "name address phone");
  if (!order) throw ApiError.notFound("Order not found");
  const uid = req.user!.id;
  const isOwner = String((order.userId as any)._id) === uid || String((order.sellerId as any)._id) === uid;
  if (!isOwner && req.user!.role !== "admin") throw ApiError.forbidden();
  const [items, approval] = await Promise.all([OrderItem.find({ orderId: order.id }), OrderApproval.findOne({ orderId: order.id })]);
  ok(res, { ...order.toObject(), items, approval });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!order) throw ApiError.notFound("Order not found");
  if (!["pending_approval", "approved", "confirmed"].includes(order.status)) throw ApiError.badRequest(`Order cannot be cancelled at stage "${order.status}"`);
  const wasPaid = order.paymentStatus === "paid";
  order.status = "cancelled";
  if (wasPaid) {
    order.paymentStatus = "refund_pending";
    await Commission.updateOne({ orderId: order.id, status: "pending" }, { status: "refunded" });
  }
  order.statusHistory.push({ status: "cancelled", note: req.body?.reason || "Cancelled by customer" } as any);
  await order.save();
  await OrderApproval.updateOne({ orderId: order.id, status: "pending" }, { status: "expired" });
  await notify({ userId: String(order.sellerId), type: "order", title: "Order cancelled", message: `Order ${order.orderNumber} was cancelled by the customer`, data: { orderId: order.id } });
  ok(res, order, wasPaid ? "Order cancelled. Refund will be processed." : "Order cancelled");
});

// ---------------- Seller side (mounted at /seller) ----------------
export const sellerRequests = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter: any = { sellerId: req.user!.id, status: (req.query.status as string) || "pending" };
  const [items, total] = await Promise.all([
    OrderApproval.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("orderId").populate("userId", "name phone profileImage"),
    OrderApproval.countDocuments(filter),
  ]);
  ok(res, items, "Success", 200, pageMeta(total, page, limit));
});

const loadPending = async (approvalId: string, sellerId: string) => {
  const approval = await OrderApproval.findOne({ _id: approvalId, sellerId });
  if (!approval) throw ApiError.notFound("Request not found");
  if (approval.status !== "pending") throw ApiError.badRequest(`Request already ${approval.status}`);
  const order = await Order.findById(approval.orderId);
  if (!order || order.status !== "pending_approval") throw ApiError.badRequest("Order is no longer awaiting approval");
  return { approval, order };
};

export const approveRequest = asyncHandler(async (req, res) => {
  const { approval, order } = await loadPending(req.params.id, req.user!.id);
  const { note, estimatedDeliveryDays, deliveryFee } = req.body;
  if (deliveryFee !== undefined) { order.deliveryFee = deliveryFee; order.total = round2(order.subtotal + order.stitchingTotal + deliveryFee); }
  if (estimatedDeliveryDays) order.estimatedDeliveryDays = estimatedDeliveryDays;
  order.status = "approved";
  order.statusHistory.push({ status: "approved", note: note || "Approved by tailor" } as any);
  approval.status = "approved"; approval.note = note; approval.decidedAt = new Date();
  approval.estimatedDeliveryDays = order.estimatedDeliveryDays ?? undefined;
  await Promise.all([order.save(), approval.save()]);
  await notify({ userId: String(order.userId), type: "approval", title: "Order approved", message: `Order ${order.orderNumber} was approved. You can pay now.`, data: { orderId: order.id } });
  ok(res, { approval, order }, "Request approved");
});

export const rejectRequest = asyncHandler(async (req, res) => {
  const { approval, order } = await loadPending(req.params.id, req.user!.id);
  order.status = "rejected";
  order.statusHistory.push({ status: "rejected", note: req.body.note } as any);
  approval.status = "rejected"; approval.note = req.body.note; approval.decidedAt = new Date();
  await Promise.all([order.save(), approval.save()]);
  await notify({ userId: String(order.userId), type: "approval", title: "Order rejected", message: `Order ${order.orderNumber} was rejected: ${req.body.note}`, data: { orderId: order.id } });
  ok(res, { approval, order }, "Request rejected");
});

const TRANSITIONS: Record<string, string[]> = {
  confirmed: ["stitching"], stitching: ["ready"], ready: ["shipped", "delivered"], shipped: ["delivered"],
};

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, sellerId: req.user!.id });
  if (!order) throw ApiError.notFound("Order not found");
  if (order.paymentStatus !== "paid") throw ApiError.badRequest("Order has not been paid yet");
  const { status, note } = req.body;
  if (!(TRANSITIONS[order.status] || []).includes(status)) throw ApiError.badRequest(`Cannot move order from "${order.status}" to "${status}"`);
  order.status = status;
  order.statusHistory.push({ status, note } as any);
  await order.save();
  await notify({ userId: String(order.userId), type: "order", title: "Order update", message: `Order ${order.orderNumber} is now ${status}`, data: { orderId: order.id, status } });
  ok(res, order, "Order status updated");
});
