import { emitToUser } from "../../sockets";
import { Notification } from "./notification.model";

type NotifyInput = {
  userId: string;
  type?: "order" | "approval" | "payment" | "chat" | "design" | "review" | "system";
  title: string;
  message: string;
  data?: unknown;
};

export const notify = async ({ userId, type = "system", title, message, data }: NotifyInput) => {
  try {
    const n = await Notification.create({ userId, type, title, message, data });
    emitToUser(String(userId), "notification:new", n);
    return n;
  } catch (err) {
    console.error("notify failed", err);
  }
};
