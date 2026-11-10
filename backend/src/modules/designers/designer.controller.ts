import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { toPoint } from "../../utils/mongo";
import { getPagination, pageMeta } from "../../utils/pagination";
import { DesignerProfile } from "./designerProfile.model";

const withLocation = (body: any) => {
  const { latitude, longitude, ...rest } = body;
  return latitude !== undefined && longitude !== undefined ? { ...rest, location: toPoint(latitude, longitude) } : rest;
};

export const createMyProfile = asyncHandler(async (req, res) => {
  if (await DesignerProfile.exists({ userId: req.user!.id })) throw ApiError.conflict("Designer profile already exists");
  created(res, await DesignerProfile.create({ ...withLocation(req.body), userId: req.user!.id }), "Designer profile submitted for verification");
});

export const getMyProfile = asyncHandler(async (req, res) => {
  const p = await DesignerProfile.findOne({ userId: req.user!.id });
  if (!p) throw ApiError.notFound("Designer profile not found");
  ok(res, p);
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const p = await DesignerProfile.findOneAndUpdate({ userId: req.user!.id }, withLocation(req.body), { new: true, runValidators: true });
  if (!p) throw ApiError.notFound("Designer profile not found");
  ok(res, p, "Profile updated");
});

export const listDesigners = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter: any = { verificationStatus: "verified" };
  if (req.query.speciality) filter.specialities = req.query.speciality;
  const [items, total] = await Promise.all([
    DesignerProfile.find(filter).populate("userId", "name profileImage").sort({ rating: -1 }).skip(skip).limit(limit),
    DesignerProfile.countDocuments(filter),
  ]);
  ok(res, items, "Success", 200, pageMeta(total, page, limit));
});

export const getDesigner = asyncHandler(async (req, res) => {
  const p = await DesignerProfile.findOne({ $or: [{ _id: req.params.id }, { userId: req.params.id }] }).populate("userId", "name profileImage");
  if (!p) throw ApiError.notFound("Designer not found");
  ok(res, p);
});
