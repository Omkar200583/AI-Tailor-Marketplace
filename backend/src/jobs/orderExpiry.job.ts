import { Order } from "../modules/orders/order.model";
import { OrderApproval } from "../modules/orders/orderApproval.model";
import { notify } from "../modules/notifications/notification.service";

const HOURS = 48;

// Cancels orders the tailor did not approve in time, and unpaid approved orders.
export const expireStaleOrders = async () => {
  const cutoff = new Date(Date.now() - HOURS * 3600 * 1000);
  const stale = await Order.find({ status: { $in: ["pending_approval", "approved"] }, updatedAt: { $lt: cutoff } });
  for (const order of stale) {
    order.status = "cancelled";
    order.statusHistory.push({ status: "cancelled", note: `Auto-cancelled: no action within ${HOURS}h` } as any);
    await order.save();
    await OrderApproval.updateOne({ orderId: order._id, status: "pending" }, { status: "expired" });
    await notify({ userId: String(order.userId), type: "order", title: "Order expired", message: `Order ${order.orderNumber} was cancelled automatically`, data: { orderId: order.id } });
  }
  if (stale.length) console.log(`[job] expired ${stale.length} stale order(s)`);
};

export const startJobs = () => {
  setInterval(() => expireStaleOrders().catch((e) => console.error("[job] expireStaleOrders", e)), 30 * 60 * 1000);
};
