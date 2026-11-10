import { Router } from "express";
import { protect } from "../../middleware/auth";
import * as c from "./notification.controller";

const router = Router();
router.use(protect);
router.get("/", c.listNotifications);
router.patch("/read-all", c.markAllRead);
router.patch("/:id/read", c.markRead);
router.delete("/:id", c.deleteNotification);
export default router;
