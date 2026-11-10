import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { slugify } from "../../utils/slugify";
import { Category } from "./category.model";

export const listCategories = asyncHandler(async (req, res) => {
  const filter: any = req.user?.role === "admin" ? {} : { isActive: true };
  if (req.query.gender) filter.gender = req.query.gender;
  if (req.query.parentId) filter.parentId = req.query.parentId;
  ok(res, await Category.find(filter).sort({ sortOrder: 1, name: 1 }));
});

export const getCategory = asyncHandler(async (req, res) => {
  const c = await Category.findOne({ $or: [{ slug: req.params.id }, ...(/^[a-f\d]{24}$/i.test(req.params.id) ? [{ _id: req.params.id }] : [])] });
  if (!c) throw ApiError.notFound("Category not found");
  ok(res, c);
});

export const createCategory = asyncHandler(async (req, res) => {
  created(res, await Category.create({ ...req.body, slug: slugify(req.body.name) }));
});

export const updateCategory = asyncHandler(async (req, res) => {
  const update = { ...req.body, ...(req.body.name ? { slug: slugify(req.body.name) } : {}) };
  const c = await Category.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!c) throw ApiError.notFound("Category not found");
  ok(res, c);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const c = await Category.findByIdAndUpdate(req.params.id, { isActive: false });
  if (!c) throw ApiError.notFound("Category not found");
  ok(res, null, "Category deactivated");
});
