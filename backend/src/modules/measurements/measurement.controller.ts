import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { BodyProfile } from "./bodyProfile.model";
import { Category } from "../categories/category.model";

export const getMyMeasurements = asyncHandler(async (req, res) => {
  ok(res, await BodyProfile.findOne({ userId: req.user!.id }));
});

export const upsertMyMeasurements = asyncHandler(async (req, res) => {
  const profile = await BodyProfile.findOneAndUpdate({ userId: req.user!.id }, { $set: req.body }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
  ok(res, profile, "Measurements saved");
});

export const deleteMyMeasurements = asyncHandler(async (req, res) => {
  await BodyProfile.findOneAndDelete({ userId: req.user!.id });
  ok(res, null, "Measurements deleted");
});

// Which measurements are required for a category, and which of them the user is still missing
export const requiredForCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.categoryId);
  if (!category) throw ApiError.notFound("Category not found");
  const profile: any = await BodyProfile.findOne({ userId: req.user!.id }).lean();
  const required = category.measurementFields || [];
  const missing = required.filter((f) => !profile || profile[f] === undefined || profile[f] === null);
  ok(res, { required, missing, complete: missing.length === 0 });
});
