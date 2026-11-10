import crypto from "crypto";
import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { getPagination, pageMeta } from "../../utils/pagination";
import { env } from "../../config/env";
import { getRazorpay } from "../../config/razorpay";
import { Payment } from "./payment.model";
import { Order } from "../orders/order.model";
import { Commission } from "../sellers/commission.model";
import { notify } from "../notifications/notification.service";

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

export const createPaymentOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.body.orderId, userId: req.user!.id });
  if (!order) throw ApiError.notFound("Order not found");
  if (order.status !== "approved") throw ApiError.badRequest("Order must be approved by the tailor before payment");
  if (order.paymentStatus === "paid") throw ApiError.badRequest("Order is already paid");

  const rzp = await getRazorpay().orders.create({
    amount: Math.round(order.total * 100), currency: order.currency, receipt: order.orderNumber, notes: { orderId: order.id },
  });
  await Payment.findOneAndUpdate(
    { orderId: order._id, status: "created" },
    { orderId: order._id, userId: order.userId, sellerId: order.sellerId, razorpayOrderId: rzp.id, amount: order.total, currency: order.currency, status: "created" },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  ok(res, { razorpayOrderId: rzp.id, amount: rzp.amount, currency: rzp.currency, keyId: env.RAZORPAY_KEY_ID, orderNumber: order.orderNumber });
});

// Idempotent: safe to call from both /verify and the webhook
const markPaid = async (razorpayOrderId: string, paymentId: string, extra: { signature?: string; method?: string } = {}) => {
  const payment = await Payment.findOne({ razorpayOrderId });
  if (!payment) throw ApiError.notFound("Payment record not found");
  if (payment.status === "paid") return payment;
  payment.status = "paid"; payment.razorpayPaymentId = paymentId; payment.paidAt = new Date();
  if (extra.signature) payment.razorpaySignature = extra.signature;
  if (extra.method) payment.method = extra.method;
  await payment.save();

  const order = await Order.findById(payment.orderId);
  if (order && order.status === "approved") {
    order.paymentStatus = "paid"; order.status = "confirmed";
    order.statusHistory.push({ status: "confirmed", note: "Payment received" } as any);
    await order.save();
    const rate = env.COMMISSION_PERCENT;
    const commissionAmount = Math.round(order.total * rate) / 100;
    await Commission.updateOne(
      { orderId: order._id },
      { $setOnInsert: { orderId: order._id, sellerId: order.sellerId, orderAmount: order.total, rate, commissionAmount, sellerAmount: Math.round((order.total - commissionAmount) * 100) / 100 } },
      { upsert: true }
    );
    await notify({ userId: String(order.sellerId), type: "payment", title: "Payment received", message: `Order ${order.orderNumber} has been paid`, data: { orderId: order.id } });
    await notify({ userId: String(order.userId), type: "payment", title: "Payment successful", message: `We received your payment for order ${order.orderNumber}`, data: { orderId: order.id } });
  }
  return payment;
};

export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const expected = crypto.createHmac("sha256", env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
  if (!safeEqual(expected, razorpay_signature)) throw ApiError.badRequest("Invalid payment signature");
  const owned = await Payment.exists({ razorpayOrderId: razorpay_order_id, userId: req.user!.id });
  if (!owned) throw ApiError.notFound("Payment record not found");
  const payment = await markPaid(razorpay_order_id, razorpay_payment_id, { signature: razorpay_signature });
  ok(res, payment, "Payment verified");
});

// Public endpoint — authenticity is proven by the HMAC signature over the raw body
export const webhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-razorpay-signature"] as string | undefined;
    if (!signature || !req.rawBody || !env.RAZORPAY_WEBHOOK_SECRET) return res.status(400).json({ success: false });
    const expected = crypto.createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET).update(req.rawBody).digest("hex");
    if (!safeEqual(expected, signature)) return res.status(400).json({ success: false, message: "Invalid signature" });

    const { event, payload } = req.body;
    const entity = payload?.payment?.entity;
    if (event === "payment.captured" && entity) await markPaid(entity.order_id, entity.id, { method: entity.method });
    if (event === "payment.failed" && entity) {
      await Payment.updateOne({ razorpayOrderId: entity.order_id, status: "created" }, { status: "failed", failureReason: entity.error_description });
    }
    res.json({ success: true });
  } catch (err) {
    console.error("webhook error", err);
    res.status(500).json({ success: false });
  }
};

export const paymentHistory = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter: any = req.user!.role === "seller" ? { sellerId: req.user!.id } : req.user!.role === "admin" ? {} : { userId: req.user!.id };
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("orderId", "orderNumber total status"),
    Payment.countDocuments(filter),
  ]);
  ok(res, items, "Success", 200, pageMeta(total, page, limit));
});
