import { Router } from "express";
import { protect } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import { createConversationSchema, sendMessageSchema } from "../../validators/chat.validator";
import * as c from "./chat.controller";

// Mounted at the API root, so auth is applied per route (a router-level guard would catch every other root-mounted route).
const router = Router();
router.get("/conversations", protect, c.listConversations);
router.post("/conversations", protect, validate({ body: createConversationSchema }), c.createConversation);
router.get("/messages/:conversationId", protect, c.listMessages);
router.post("/messages", protect, validate({ body: sendMessageSchema }), c.postMessage);
export default router;
