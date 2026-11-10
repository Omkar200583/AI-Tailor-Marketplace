import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { toPoint } from "../../utils/mongo";
import { getPagination, pageMeta } from "../../utils/pagination";
import { Shop } from "./shop.model";
import { SellerProfile } from "../sellers/sellerProfile.model";

export const createShop = asyncHandler(async (req, res) => {
  const profile = await SellerProfile.findOne({ userId: req.user!.id });
  if (!profile || profile.verificationStatus !== "verified") throw ApiError.forbidden("Your seller profile must be verified before creating a shop");
  const { latitude, longitude, ...rest } = req.body;
  created(res, await Shop.create({ ...rest, sellerId: req.user!.id, location: toPoint(latitude, longitude) }));
});

export const myShops = asyncHandler(async (req, res) => {
  ok(res, await Shop.find({ sellerId: req.user!.id }).sort({ createdAt: -1 }));
});

export const updateShop = asyncHandler(async (req, res) => {
  const { latitude, longitude, ...rest } = req.body;
  const update: any = { ...rest };
  if (latitude !== undefined && longitude !== undefined) update.location = toPoint(latitude, longitude);
  const shop = await Shop.findOneAndUpdate({ _id: req.params.id, sellerId: req.user!.id }, update, { new: true, runValidators: true });
  if (!shop) throw ApiError.notFound("Shop not found");
  ok(res, shop);
});

export const deleteShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findOneAndUpdate({ _id: req.params.id, sellerId: req.user!.id }, { isActive: false });
  if (!shop) throw ApiError.notFound("Shop not found");
  ok(res, null, "Shop deactivated");
});

export const listShops = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter: any = { isActive: true };
  if (req.query.sellerId) filter.sellerId = req.query.sellerId;
  const [items, total] = await Promise.all([
    Shop.find(filter).sort({ rating: -1 }).skip(skip).limit(limit),
    Shop.countDocuments(filter),
  ]);
  ok(res, items, "Success", 200, pageMeta(total, page, limit));
});

export const getShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findById(req.params.id);
  if (!shop || !shop.isActive) throw ApiError.notFound("Shop not found");
  ok(res, shop);
});
