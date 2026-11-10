import { Types } from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { getPagination, pageMeta } from "../../utils/pagination";
import { User } from "../users/user.model";
import { SellerProfile } from "../sellers/sellerProfile.model";
import { DesignerProfile } from "../designers/designerProfile.model";
import { Commission } from "../sellers/commission.model";
import { SellerPayout } from "../sellers/sellerPayout.model";
import { SupportTicket } from "./supportTicket.model";
import { AiUsageLog } from "./aiUsageLog.model";
import { Order } from "../orders/order.model";
import { Product } from "../products/product.model";
import { Payment } from "../payments/payment.model";
import { notify } from "../notifications/notification.service";

// ---------- Users ----------
export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter: any = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.q) { const re = new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"); filter.$or = [{ name: re }, { email: re }, { phone: re }]; }
  const [items, total] = await Promise.all([User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit), User.countDocuments(filter)]);
  ok(res, items, "Success", 200, pageMeta(total, page, limit));
});

export const setUserStatus = asyncHandler(async (req, res) => {
  if (req.params.id === req.user!.id) throw ApiError.badRequest("You cannot change your own status");
  const u = await User.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true });
  if (!u) throw ApiError.notFound("User not found");
  ok(res, u, u.isActive ? "User activated" : "User deactivated");
});

// ---------- Verification of sellers / designers ----------
const listProfiles = (Model: any) => asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { verificationStatus: (req.query.status as string) || "pending" };
  const [items, total] = await Promise.all([
    Model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("userId", "name email phone"),
    Model.countDocuments(filter),
  ]);
  ok(res, items, "Success", 200, pageMeta(total, page, limit));
});
export const listSellerProfiles = listProfiles(SellerProfile);
export const listDesignerProfiles = listProfiles(DesignerProfile);

const verifyProfile = (Model: any, label: string) => asyncHandler(async (req, res) => {
  const p = await Model.findByIdAndUpdate(req.params.id, { verificationStatus: req.body.status, verificationNote: req.body.note }, { new: true });
  if (!p) throw ApiError.notFound(`${label} profile not found`);
  await notify({ userId: String(p.userId), type: "system", title: `${label} profile ${req.body.status}`, message: req.body.note || `Your ${label.toLowerCase()} profile is now ${req.body.status}` });
  ok(res, p, `${label} ${req.body.status}`);
});
export const verifySeller = verifyProfile(SellerProfile, "Seller");
export const verifyDesigner = verifyProfile(DesignerProfile, "Designer");

// ---------- Commissions & payouts ----------
export const listCommissions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter: any = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.sellerId) filter.sellerId = req.query.sellerId;
  const [items, total, [totals]] = await Promise.all([
    Commission.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("orderId", "orderNumber total").populate("sellerId", "name"),
    Commission.countDocuments(filter),
    Commission.aggregate([{ $match: filter }, { $group: { _id: null, commission: { $sum: "$commissionAmount" }, sellerAmount: { $sum: "$sellerAmount" } } }]),
  ]);
  ok(res, { items, totals: totals || { commission: 0, sellerAmount: 0 } }, "Success", 200, pageMeta(total, page, limit));
});

// Bundle all pending commissions of a seller into one payout
export const createPayout = asyncHandler(async (req, res) => {
  const pending = await Commission.find({ sellerId: req.body.sellerId, status: "pending" });
  if (!pending.length) throw ApiError.badRequest("No pending earnings for this seller");
  const amount = Math.round(pending.reduce((s, c) => s + c.sellerAmount, 0) * 100) / 100;
  const payout = await SellerPayout.create({ sellerId: req.body.sellerId, amount, commissionIds: pending.map((c) => c._id), note: req.body.note });
  await Commission.updateMany({ _id: { $in: pending.map((c) => c._id) } }, { status: "settled", payoutId: payout._id });
  created(res, payout, "Payout created");
});

export const updatePayout = asyncHandler(async (req, res) => {
  const payout = await SellerPayout.findById(req.params.id);
  if (!payout) throw ApiError.notFound("Payout not found");
  payout.status = req.body.status; if (req.body.reference) payout.reference = req.body.reference;
  if (req.body.status === "paid") payout.paidAt = new Date();
  if (req.body.status === "failed") await Commission.updateMany({ payoutId: payout._id }, { status: "pending", $unset: { payoutId: 1 } });
  await payout.save();
  if (payout.status === "paid") await notify({ userId: String(payout.sellerId), type: "payment", title: "Payout sent", message: `₹${payout.amount} has been paid out to you` });
  ok(res, payout);
});

export const listPayouts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter: any = req.user!.role === "seller" ? { sellerId: req.user!.id } : {};
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    SellerPayout.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("sellerId", "name"),
    SellerPayout.countDocuments(filter),
  ]);
  ok(res, items, "Success", 200, pageMeta(total, page, limit));
});

// ---------- Support tickets ----------
export const createTicket = asyncHandler(async (req, res) => {
  created(res, await SupportTicket.create({ ...req.body, userId: req.user!.id }), "Ticket created");
});

export const listTickets = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter: any = req.user!.role === "admin" ? {} : { userId: req.user!.id };
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    SupportTicket.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("userId", "name email"),
    SupportTicket.countDocuments(filter),
  ]);
  ok(res, items, "Success", 200, pageMeta(total, page, limit));
});

export const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) throw ApiError.notFound("Ticket not found");
  const isAdmin = req.user!.role === "admin";
  if (!isAdmin && String(ticket.userId) !== req.user!.id) throw ApiError.forbidden();
  const { status, priority, response } = req.body;
  if (isAdmin) { if (status) ticket.status = status; if (priority) ticket.priority = priority; }
  if (response) ticket.responses.push({ authorId: req.user!.id, text: response } as any);
  await ticket.save();
  if (isAdmin && response) await notify({ userId: String(ticket.userId), type: "system", title: "Support reply", message: response.slice(0, 120), data: { ticketId: ticket.id } });
  ok(res, ticket);
});

// ---------- AI usage ----------
export const aiUsage = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - (Number(req.query.days) || 30) * 86400000);
  const summary = await AiUsageLog.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { feature: "$feature", status: "$status" }, count: { $sum: 1 }, avgMs: { $avg: "$durationMs" } } },
  ]);
  const { page, limit, skip } = getPagination(req.query);
  const logs = await AiUsageLog.find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("userId", "name email");
  ok(res, { summary, logs });
});

// ---------- Analytics ----------
const revenueByDay = (match: any, days: number) =>
  Order.aggregate([
    { $match: { ...match, paymentStatus: "paid", createdAt: { $gte: new Date(Date.now() - days * 86400000) } } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

export const adminDashboard = asyncHandler(async (req, res) => {
  const days = Math.min(365, Number(req.query.days) || 30);
  const [users, roles, ordersByStatus, revenue, commission, topSellers, daily, pendingSellers, openTickets, products] = await Promise.all([
    User.countDocuments(),
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Payment.aggregate([{ $match: { status: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }]),
    Commission.aggregate([{ $match: { status: { $ne: "refunded" } } }, { $group: { _id: null, total: { $sum: "$commissionAmount" } } }]),
    Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: "$sellerId", revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
      { $sort: { revenue: -1 } }, { $limit: 5 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "seller" } },
      { $project: { revenue: 1, orders: 1, name: { $arrayElemAt: ["$seller.name", 0] } } },
    ]),
    revenueByDay({}, days),
    SellerProfile.countDocuments({ verificationStatus: "pending" }),
    SupportTicket.countDocuments({ status: { $in: ["open", "in_progress"] } }),
    Product.countDocuments({ status: "active" }),
  ]);
  ok(res, {
    users, usersByRole: roles, activeProducts: products, ordersByStatus,
    grossRevenue: revenue[0]?.total || 0, paidOrders: revenue[0]?.count || 0, platformCommission: commission[0]?.total || 0,
    topSellers, revenueByDay: daily, pendingSellerVerifications: pendingSellers, openTickets,
  });
});

export const sellerAnalytics = asyncHandler(async (req, res) => {
  const sellerId = req.user!.id;
  const sid = new Types.ObjectId(sellerId);
  const days = Math.min(365, Number(req.query.days) || 30);
  const [byStatus, totals, earnings, daily, topProducts] = await Promise.all([
    Order.aggregate([{ $match: { sellerId: sid } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { sellerId: sid, paymentStatus: "paid" } }, { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 } } }]),
    Commission.aggregate([
      { $match: { sellerId: sid, status: { $ne: "refunded" } } },
      { $group: { _id: "$status", sellerAmount: { $sum: "$sellerAmount" }, commission: { $sum: "$commissionAmount" } } },
    ]),
    revenueByDay({ sellerId: sid }, days),
    Product.find({ sellerId }).sort({ ratingCount: -1, rating: -1 }).limit(5).select("name rating ratingCount price"),
  ]);
  ok(res, { ordersByStatus: byStatus, revenue: totals[0]?.revenue || 0, paidOrders: totals[0]?.orders || 0, earnings, revenueByDay: daily, topProducts });
});
