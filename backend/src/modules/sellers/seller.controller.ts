import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { toPoint } from "../../utils/mongo";
import { getPagination, pageMeta } from "../../utils/pagination";
import { SellerProfile } from "./sellerProfile.model";

export const createMyProfile = asyncHandler(async (req, res) => {
  const { latitude, longitude, ...rest } = req.body;
  if (await SellerProfile.exists({ userId: req.user!.id })) throw ApiError.conflict("Seller profile already exists");
  const profile = await SellerProfile.create({ ...rest, userId: req.user!.id, location: toPoint(latitude, longitude) });
  created(res, profile, "Seller profile submitted for verification");
});

export const getMyProfile = asyncHandler(async (req, res) => {
  const p = await SellerProfile.findOne({ userId: req.user!.id });
  if (!p) throw ApiError.notFound("Seller profile not found");
  ok(res, p);
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const { latitude, longitude, ...rest } = req.body;
  const update: any = { ...rest };
  if (latitude !== undefined && longitude !== undefined) update.location = toPoint(latitude, longitude);
  const p = await SellerProfile.findOneAndUpdate({ userId: req.user!.id }, update, { new: true, runValidators: true });
  if (!p) throw ApiError.notFound("Seller profile not found");
  ok(res, p, "Profile updated");
});

export const listSellers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter: any = { verificationStatus: "verified" };
  if (req.query.city) filter.city = new RegExp(`^${String(req.query.city).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
  if (req.query.service) filter.services = req.query.service;
  const [items, total] = await Promise.all([
    SellerProfile.find(filter).populate("userId", "name profileImage").sort({ rating: -1 }).skip(skip).limit(limit),
    SellerProfile.countDocuments(filter),
  ]);
  ok(res, items, "Success", 200, pageMeta(total, page, limit));
});

export const getSeller = asyncHandler(async (req, res) => {
  const p = await SellerProfile.findOne({ $or: [{ _id: req.params.id }, { userId: req.params.id }] }).populate("userId", "name profileImage");
  if (!p) throw ApiError.notFound("Seller not found");
  ok(res, p);
});
