import { Router } from "express";
import authRoutes from "./auth/auth.routes";
import userRoutes from "./users/user.routes";
import sellerRoutes from "./sellers/seller.routes";
import designerRoutes from "./designers/designer.routes";
import shopRoutes from "./shops/shop.routes";
import productRoutes from "./products/product.routes";
import categoryRoutes from "./categories/category.routes";
import measurementRoutes from "./measurements/measurement.routes";
import { designRouter, designRequestRouter } from "./designs/design.routes";
import tryonRoutes from "./tryon/tryon.routes";
import { cartRouter, wishlistRouter } from "./cart/cart.routes";
import { orderRouter, sellerOrderRouter } from "./orders/order.routes";
import paymentRoutes from "./payments/payment.routes";
import chatRoutes from "./chat/chat.routes";
import locationRoutes from "./location/location.routes";
import reviewRoutes from "./reviews/review.routes";
import notificationRoutes from "./notifications/notification.routes";
import recommendationRoutes from "./recommendations/recommendation.routes";
import { adminRouter, supportRouter, analyticsRouter, sellerPayoutRouter } from "./admin/admin.routes";

const api = Router();

api.use("/auth", authRoutes);
api.use("/users", userRoutes);
api.use("/sellers", sellerRoutes);
api.use("/seller", sellerOrderRouter);     // approval flow: requests, approve, reject, order status
api.use("/seller", sellerPayoutRouter);
api.use("/designers", designerRoutes);
api.use("/shops", shopRoutes);
api.use("/products", productRoutes);
api.use("/categories", categoryRoutes);
api.use("/measurements", measurementRoutes);
api.use("/ai/design", designRouter);
api.use("/design-requests", designRequestRouter);
api.use("/tryon", tryonRoutes);
api.use("/cart", cartRouter);
api.use("/wishlist", wishlistRouter);
api.use("/orders", orderRouter);
api.use("/payments", paymentRoutes);
api.use("/notifications", notificationRoutes);
api.use("/reviews", reviewRoutes);
api.use("/recommendations", recommendationRoutes);
api.use("/support", supportRouter);
api.use("/analytics", analyticsRouter);
api.use("/admin", adminRouter);
api.use("/", chatRoutes);      // /conversations, /messages
api.use("/", locationRoutes);  // /location, /tailors|designers|shops/nearby

export default api;
