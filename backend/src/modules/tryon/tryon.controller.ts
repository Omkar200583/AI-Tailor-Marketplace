import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { getPagination, pageMeta } from "../../utils/pagination";
import { callAiEngine } from "../../utils/aiClient";
import { env } from "../../config/env";
import { TryonSession } from "./tryonSession.model";
import { UserPhoto } from "../users/userPhoto.model";
import { Product } from "../products/product.model";
import { Design } from "../designs/design.model";
import { withUsageLog } from "../designs/aiUsage";

const abs = (u: string) => (u.startsWith("http") ? u : `${process.env.PUBLIC_URL || `http://localhost:${env.PORT}`}${u}`);

export const createSession = asyncHandler(async (req, res) => {
  const { photoId, productId, designId } = req.body;
  const photo = await UserPhoto.findOne({ _id: photoId, userId: req.user!.id });
  if (!photo) throw ApiError.notFound("Photo not found");

  let garmentImage: string | undefined;
  if (productId) {
    const p = await Product.findById(productId);
    if (!p) throw ApiError.notFound("Product not found");
    garmentImage = p.images?.[0];
  } else {
    const d = await Design.findOne({ _id: designId, userId: req.user!.id });
    if (!d) throw ApiError.notFound("Design not found");
    garmentImage = d.images?.[0];
  }
  if (!garmentImage) throw ApiError.badRequest("Selected item has no image to try on");
  created(res, await TryonSession.create({ userId: req.user!.id, photoId, productId, designId, garmentImage }), "Try-on session created");
});

export const generateTryon = asyncHandler(async (req, res) => {
  const session = await TryonSession.findOne({ _id: req.body.sessionId, userId: req.user!.id }).populate("photoId");
  if (!session) throw ApiError.notFound("Session not found");
  if (session.status === "processing") throw ApiError.conflict("Try-on is already being generated");
  session.status = "processing"; session.error = undefined; await session.save();

  try {
    const result = await withUsageLog(req.user!.id, "tryon", { refId: session._id }, () =>
      callAiEngine<{ images: string[]; meta?: any }>("/api/v1/tryon/generate", {
        person_image: abs((session.photoId as any).url), garment_image: abs(session.garmentImage),
      })
    );
    session.resultImages = result.images || []; session.aiMeta = result.meta; session.status = "completed";
  } catch (err: any) {
    session.status = "failed"; session.error = err.message;
    await session.save();
    throw err;
  }
  await session.save();
  ok(res, session, "Try-on generated");
});

export const getSession = asyncHandler(async (req, res) => {
  const s = await TryonSession.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!s) throw ApiError.notFound("Session not found");
  ok(res, s);
});

export const listSessions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { userId: req.user!.id };
  const [items, total] = await Promise.all([
    TryonSession.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    TryonSession.countDocuments(filter),
  ]);
  ok(res, items, "Success", 200, pageMeta(total, page, limit));
});

export const deleteSession = asyncHandler(async (req, res) => {
  const s = await TryonSession.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
  if (!s) throw ApiError.notFound("Session not found");
  ok(res, null, "Session deleted");
});
