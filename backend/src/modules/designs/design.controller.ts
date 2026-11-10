import { asyncHandler } from "../../utils/asyncHandler";
import { ok, created } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { getPagination, pageMeta } from "../../utils/pagination";
import { callAiEngine } from "../../utils/aiClient";
import { Design } from "./design.model";
import { DesignRequest } from "./designRequest.model";
import { withUsageLog } from "./aiUsage";
import { Category } from "../categories/category.model";
import { BodyProfile } from "../measurements/bodyProfile.model";
import { User } from "../users/user.model";
import { findOrCreateConversation } from "../chat/chat.service";
import { notify } from "../notifications/notification.service";

export const generateDesign = asyncHandler(async (req, res) => {
  const { prompt, category, numImages, ...opts } = req.body;
  const cat = category ? await Category.findById(category) : null;
  if (category && !cat) throw ApiError.notFound("Category not found");

  const result = await withUsageLog(req.user!.id, "design", { promptChars: prompt.length }, () =>
    callAiEngine<{ images: string[]; enhanced_prompt?: string; meta?: any }>("/api/v1/design/generate", {
      prompt, category: cat?.name, num_images: numImages, ...opts,
    })
  );
  const design = await Design.create({
    userId: req.user!.id, prompt, category, ...opts, enhancedPrompt: result.enhanced_prompt, images: result.images || [], aiMeta: result.meta,
  });
  created(res, design, "Design generated");
});

export const designHistory = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter: any = { userId: req.user!.id };
  if (req.query.saved === "true") filter.isSaved = true;
  const [items, total] = await Promise.all([
    Design.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Design.countDocuments(filter),
  ]);
  ok(res, items, "Success", 200, pageMeta(total, page, limit));
});

export const getDesign = asyncHandler(async (req, res) => {
  const design = await Design.findById(req.params.id);
  if (!design) throw ApiError.notFound("Design not found");
  if (String(design.userId) !== req.user!.id) {
    // recipients of a design request may view the design
    const shared = await DesignRequest.exists({ designId: design.id, recipientId: req.user!.id });
    if (!shared && req.user!.role !== "admin") throw ApiError.forbidden();
  }
  ok(res, design);
});

export const saveDesign = asyncHandler(async (req, res) => {
  const design = await Design.findOneAndUpdate(
    { _id: req.body.designId, userId: req.user!.id }, { isSaved: true, ...(req.body.title ? { title: req.body.title } : {}) }, { new: true }
  );
  if (!design) throw ApiError.notFound("Design not found");
  ok(res, design, "Design saved");
});

export const deleteDesign = asyncHandler(async (req, res) => {
  const d = await Design.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
  if (!d) throw ApiError.notFound("Design not found");
  ok(res, null, "Design deleted");
});

export const sendToTailor = asyncHandler(async (req, res) => {
  const design = await Design.findOne({ _id: req.params.id, userId: req.user!.id });
  if (!design) throw ApiError.notFound("Design not found");
  const { recipientId, recipientType, message, budget, useBodyProfile } = req.body;
  const recipient = await User.findOne({ _id: recipientId, role: recipientType, isActive: true });
  if (!recipient) throw ApiError.notFound(`${recipientType} not found`);

  const measurements = useBodyProfile ? await BodyProfile.findOne({ userId: req.user!.id }).lean() : undefined;
  const request = await DesignRequest.create({ designId: design._id, userId: req.user!.id, recipientId, recipientType, message, budget, measurements });
  design.isSaved = true; await design.save();
  const convo = await findOrCreateConversation(req.user!.id, recipientId, { designRequestId: request.id });
  await notify({ userId: recipientId, type: "design", title: "New custom design request", message: message || "A customer sent you an AI-generated design", data: { designRequestId: request.id, conversationId: convo.id } });
  created(res, { request, conversationId: convo.id }, "Design sent");
});

// ---- Design requests (customer + seller/designer view) ----
export const listDesignRequests = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter: any = req.user!.role === "user" ? { userId: req.user!.id } : { recipientId: req.user!.id };
  if (req.query.status) filter.status = req.query.status;
  const [items, total] = await Promise.all([
    DesignRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("designId").populate("userId", "name profileImage").populate("recipientId", "name profileImage"),
    DesignRequest.countDocuments(filter),
  ]);
  ok(res, items, "Success", 200, pageMeta(total, page, limit));
});

export const respondDesignRequest = asyncHandler(async (req, res) => {
  const dr = await DesignRequest.findOne({ _id: req.params.id, recipientId: req.user!.id });
  if (!dr) throw ApiError.notFound("Design request not found");
  if (dr.status !== "pending") throw ApiError.badRequest(`Request already ${dr.status}`);
  const { action, amount, deliveryDays, note } = req.body;
  if (action === "accept" && amount === undefined) throw ApiError.badRequest("A quote amount is required to accept");
  dr.status = action === "accept" ? "accepted" : "rejected";
  dr.quote = action === "accept" ? ({ amount, deliveryDays, note } as any) : ({ note } as any);
  dr.respondedAt = new Date();
  await dr.save();
  await notify({ userId: String(dr.userId), type: "design", title: `Design request ${dr.status}`, message: action === "accept" ? `Quote received: ₹${amount}` : note || "Your request was declined", data: { designRequestId: dr.id } });
  ok(res, dr, `Request ${dr.status}`);
});
