import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/ApiResponse";
import { toPoint } from "../../utils/mongo";
import { User } from "../users/user.model";
import { SellerProfile } from "../sellers/sellerProfile.model";
import { DesignerProfile } from "../designers/designerProfile.model";
import { Shop } from "../shops/shop.model";

export const saveLocation = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user!.id, { lastLocation: toPoint(req.body.latitude, req.body.longitude) });
  ok(res, null, "Location saved");
});

const near = (q: any) => ({
  $near: { $geometry: { type: "Point", coordinates: [q.lng, q.lat] }, $maxDistance: q.radiusKm * 1000 },
});

// Haversine distance in km, added to every result
const withDistance = (docs: any[], q: any) =>
  docs.map((d) => {
    const [lng, lat] = d.location.coordinates;
    const R = 6371, rad = (x: number) => (x * Math.PI) / 180;
    const a = Math.sin(rad(lat - q.lat) / 2) ** 2 + Math.cos(rad(q.lat)) * Math.cos(rad(lat)) * Math.sin(rad(lng - q.lng) / 2) ** 2;
    return { ...d, distanceKm: Math.round(2 * R * Math.asin(Math.sqrt(a)) * 10) / 10 };
  });

export const nearbyTailors = asyncHandler(async (req, res) => {
  const q: any = req.query;
  const filter: any = { verificationStatus: "verified", availability: { $ne: "closed" }, location: near(q) };
  if (q.service) filter.services = q.service;
  const items = await SellerProfile.find(filter).limit(q.limit).populate("userId", "name profileImage").lean();
  ok(res, withDistance(items, q));
});

export const nearbyDesigners = asyncHandler(async (req, res) => {
  const q: any = req.query;
  const filter: any = { verificationStatus: "verified", availability: { $ne: "closed" }, location: near(q) };
  if (q.service) filter.specialities = q.service;
  const items = await DesignerProfile.find(filter).limit(q.limit).populate("userId", "name profileImage").lean();
  ok(res, withDistance(items, q));
});

export const nearbyShops = asyncHandler(async (req, res) => {
  const q: any = req.query;
  const items = await Shop.find({ isActive: true, location: near(q) }).limit(q.limit).lean();
  ok(res, withDistance(items, q));
});
