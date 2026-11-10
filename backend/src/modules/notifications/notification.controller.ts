import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { getPagination, pageMeta } from "../../utils/pagination";
import { Notification } from "./notification.model";

export const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter: any = { userId: req.user!.id };
  if (req.query.unread === "true") filter.isRead = false;
  const [items, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: req.user!.id, isRead: false }),
  ]);
  ok(res, { items, unread }, "Success", 200, pageMeta(total, page, limit));
});

export const markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user!.id }, { isRead: true }, { new: true });
  if (!n) throw ApiError.notFound("Notification not found");
  ok(res, n);
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user!.id, isRead: false }, { isRead: true });
  ok(res, null, "All notifications marked as read");
});

export const deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
  ok(res, null, "Deleted");
});
