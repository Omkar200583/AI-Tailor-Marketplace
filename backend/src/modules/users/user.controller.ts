import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { toPoint } from "../../utils/mongo";
import { fileUrl } from "../../middleware/upload";
import { User } from "./user.model";
import { Address } from "./address.model";
import { UserPhoto } from "./userPhoto.model";

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  ok(res, user);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findByIdAndUpdate(req.user!.id, req.body, { new: true, runValidators: true });
  ok(res, user, "Profile updated");
});

export const uploadProfileImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("Image file is required (field: image)");
  const user = await User.findByIdAndUpdate(req.user!.id, { profileImage: fileUrl(req.file.filename) }, { new: true });
  ok(res, user, "Profile image updated");
});

// ---- Addresses ----
export const listAddresses = asyncHandler(async (req, res) => {
  ok(res, await Address.find({ userId: req.user!.id }).sort({ isDefault: -1, createdAt: -1 }));
});

export const addAddress = asyncHandler(async (req, res) => {
  const { latitude, longitude, ...rest } = req.body;
  const count = await Address.countDocuments({ userId: req.user!.id });
  const isDefault = rest.isDefault || count === 0;
  if (isDefault) await Address.updateMany({ userId: req.user!.id }, { isDefault: false });
  const address = await Address.create({
    ...rest, isDefault, userId: req.user!.id,
    ...(latitude !== undefined && longitude !== undefined ? { location: toPoint(latitude, longitude) } : {}),
  });
  created(res, address, "Address added");
});

export const updateAddress = asyncHandler(async (req, res) => {
  const { latitude, longitude, ...rest } = req.body;
  if (rest.isDefault) await Address.updateMany({ userId: req.user!.id }, { isDefault: false });
  const address = await Address.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.id },
    { ...rest, ...(latitude !== undefined && longitude !== undefined ? { location: toPoint(latitude, longitude) } : {}) },
    { new: true, runValidators: true }
  );
  if (!address) throw ApiError.notFound("Address not found");
  ok(res, address, "Address updated");
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
  if (!address) throw ApiError.notFound("Address not found");
  ok(res, null, "Address deleted");
});

// ---- Photos (for try-on / measurements) ----
export const uploadPhotos = asyncHandler(async (req, res) => {
  const files = (req.files as Express.Multer.File[]) || [];
  if (!files.length) throw ApiError.badRequest("At least one image is required (field: photos)");
  const docs = await UserPhoto.insertMany(
    files.map((f) => ({
      userId: req.user!.id, url: fileUrl(f.filename), mimeType: f.mimetype, size: f.size,
      type: req.body.type || "full_body",
    }))
  );
  created(res, docs, "Photos uploaded");
});

export const listPhotos = asyncHandler(async (req, res) => {
  ok(res, await UserPhoto.find({ userId: req.user!.id }).sort({ createdAt: -1 }));
});

export const deletePhoto = asyncHandler(async (req, res) => {
  const photo = await UserPhoto.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
  if (!photo) throw ApiError.notFound("Photo not found");
  ok(res, null, "Photo deleted");
});
