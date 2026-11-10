import { Request } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { getPagination, pageMeta } from "../../utils/pagination";
import { Product } from "./product.model";
import { ProductImage } from "./productImage.model";
import { ProductVariant } from "./productVariant.model";
import { Shop } from "../shops/shop.model";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const syncImages = async (productId: string, images: string[]) => {
  await ProductImage.deleteMany({ productId });

  if (images.length) {
    await ProductImage.insertMany(
      images.map((url, index) => ({
        productId,
        url,
        isPrimary: index === 0,
        sortOrder: index,
      }))
    );
  }
};

const syncVariants = async (productId: string, variants: any[]) => {
  await ProductVariant.deleteMany({ productId });

  if (variants?.length) {
    await ProductVariant.insertMany(
      variants.map(({ _id, ...variant }) => ({
        ...variant,
        productId,
      }))
    );
  }
};

const normalizeProductData = (data: any) => {
  const normalized = { ...data };

  if (normalized.categoryId) {
    normalized.category = normalized.categoryId;
    delete normalized.categoryId;
  }

  return normalized;
};

export const createProduct = asyncHandler(async (req, res) => {
  const { variants = [], ...rawData } = req.body;
  const data = normalizeProductData(rawData);

  const shop = await Shop.findOne({
    _id: data.shopId,
    sellerId: req.user!.id,
    isActive: true,
  });

  if (!shop) {
    throw ApiError.forbidden("Shop not found or not owned by you");
  }

  const product = await Product.create({
    ...data,
    sellerId: req.user!.id,
    images: data.images || [],
  });

  await syncImages(product.id, product.images);

  if (variants.length) {
    await syncVariants(product.id, variants);
  }

  created(res, product, "Product created");
});

const buildFilter = (req: Request) => {
  const query: any = req.query;

  const filter: any = {
    status: "active",
  };

  if (query.q) {
    filter.$text = { $search: String(query.q) };
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.shopId) {
    filter.shopId = query.shopId;
  }

  if (query.sellerId) {
    filter.sellerId = query.sellerId;
  }

  if (query.fabric) {
    filter.fabric = new RegExp(
      escapeRegex(String(query.fabric)),
      "i"
    );
  }

  if (query.customizable !== undefined) {
    filter.customizationAvailable =
      query.customizable === "true";
  }

  if (
    query.minPrice !== undefined ||
    query.maxPrice !== undefined
  ) {
    filter.price = {};

    if (query.minPrice !== undefined) {
      filter.price.$gte = Number(query.minPrice);
    }

    if (query.maxPrice !== undefined) {
      filter.price.$lte = Number(query.maxPrice);
    }
  }

  return filter;
};

export const listProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = buildFilter(req);

  const sortMap: Record<string, any> = {
    newest: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating: { rating: -1 },
  };

  const sort =
    sortMap[String(req.query.sort)] ||
    (req.query.q
      ? { score: { $meta: "textScore" } }
      : { createdAt: -1 });

  const projection = req.query.q
    ? { score: { $meta: "textScore" } }
    : {};

  const [items, total] = await Promise.all([
    Product.find(filter, projection)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("category", "name slug")
      .populate("shopId", "name city"),

    Product.countDocuments(filter),
  ]);

  ok(
    res,
    items,
    "Success",
    200,
    pageMeta(total, page, limit)
  );
});

export const myProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const filter: any = {
    sellerId: req.user!.id,
  };

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("category", "name slug"),

    Product.countDocuments(filter),
  ]);

  ok(
    res,
    items,
    "Success",
    200,
    pageMeta(total, page, limit)
  );
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("category", "name slug")
    .populate("shopId", "name city address location phone");

  if (!product || product.status === "inactive") {
    throw ApiError.notFound("Product not found");
  }

  const [images, variants] = await Promise.all([
    ProductImage.find({ productId: product.id })
      .sort({ sortOrder: 1 }),

    ProductVariant.find({
      productId: product.id,
      isActive: true,
    }),
  ]);

  ok(res, {
    ...product.toObject(),
    gallery: images,
    variants,
  });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { variants, ...rawData } = req.body;
  const data = normalizeProductData(rawData);

  if (data.shopId) {
    const shop = await Shop.exists({
      _id: data.shopId,
      sellerId: req.user!.id,
    });

    if (!shop) {
      throw ApiError.forbidden("Shop not owned by you");
    }
  }

  const product = await Product.findOneAndUpdate(
    {
      _id: req.params.id,
      sellerId: req.user!.id,
    },
    data,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  if (data.images !== undefined) {
    await syncImages(product.id, data.images);
  }

  if (variants !== undefined) {
    await syncVariants(product.id, variants);
  }

  ok(res, product, "Product updated");
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const filter: any = {
    _id: req.params.id,
  };

  if (req.user!.role !== "admin") {
    filter.sellerId = req.user!.id;
  }

  const product = await Product.findOneAndUpdate(
    filter,
    { status: "inactive" },
    { new: true }
  );

  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  ok(res, null, "Product removed");
});
