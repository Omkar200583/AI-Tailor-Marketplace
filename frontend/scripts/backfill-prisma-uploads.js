require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Connected to Prisma database");

  // 1. Users — profileImage
  console.log("\n[1/5] Clearing broken profileImage on users...");
  const users = await prisma.user.findMany({ where: { profileImage: { startsWith: "/uploads/" } } });
  console.log("  Found " + users.length + " users with broken profileImage");
  for (const u of users) {
    await prisma.user.update({ where: { id: u.id }, data: { profileImage: "" } });
  }

  // 2. Designs — imageUrl
  console.log("\n[2/5] Clearing broken imageUrl on designs...");
  const designs = await prisma.design.findMany({ where: { imageUrl: { startsWith: "/uploads/" } } });
  console.log("  Found " + designs.length + " designs with broken imageUrl");
  for (const d of designs) {
    await prisma.design.update({ where: { id: d.id }, data: { imageUrl: "" } });
  }

  // 3. TryonSessions — resultImage + productImage
  console.log("\n[3/5] Clearing broken images on tryonSessions...");
  const tryons = await prisma.tryonSession.findMany({
    where: {
      OR: [
        { resultImage: { startsWith: "/uploads/" } },
        { productImage: { startsWith: "/uploads/" } },
      ]
    }
  });
  console.log("  Found " + tryons.length + " tryonSessions with broken images");
  for (const t of tryons) {
    const data = {};
    if (t.resultImage && t.resultImage.startsWith("/uploads/")) data.resultImage = "";
    if (t.productImage && t.productImage.startsWith("/uploads/")) data.productImage = "";
    await prisma.tryonSession.update({ where: { id: t.id }, data });
  }

  // 4. Products — images (stored as JSON string array)
  console.log("\n[4/5] Cleaning broken images array on products...");
  const products = await prisma.product.findMany();
  let productsFixed = 0;
  for (const p of products) {
    try {
      const images = JSON.parse(p.images || "[]");
      const clean = images.filter((u) => !u.startsWith("/uploads/"));
      if (clean.length !== images.length) {
        await prisma.product.update({ where: { id: p.id }, data: { images: JSON.stringify(clean) } });
        productsFixed++;
      }
    } catch (e) { /* skip invalid JSON */ }
  }
  console.log("  Cleaned " + productsFixed + " products");

  // 5. SellerProfile — shopImage + portfolio
  console.log("\n[5/5] Cleaning broken shopImage/portfolio on sellerProfiles...");
  const sellers = await prisma.sellerProfile.findMany({
    where: {
      OR: [
        { shopImage: { startsWith: "/uploads/" } },
        { portfolio: { contains: "/uploads/" } },
      ]
    }
  });
  console.log("  Found " + sellers.length + " sellerProfiles with broken images");
  for (const s of sellers) {
    const data = {};
    if (s.shopImage && s.shopImage.startsWith("/uploads/")) data.shopImage = "";
    if (s.portfolio && s.portfolio.includes("/uploads/")) {
      try {
        const portfolio = JSON.parse(s.portfolio || "[]");
        const cleanPortfolio = portfolio.filter((u) => !u.startsWith("/uploads/"));
        data.portfolio = JSON.stringify(cleanPortfolio);
      } catch (e) { /* skip */ }
    }
    await prisma.sellerProfile.update({ where: { id: s.id }, data });
  }

  // Verification
  console.log("\n--- Verification ---");
  const remainingUsers = await prisma.user.count({ where: { profileImage: { startsWith: "/uploads/" } } });
  const remainingDesigns = await prisma.design.count({ where: { imageUrl: { startsWith: "/uploads/" } } });
  const remainingTryons = await prisma.tryonSession.count({
    where: {
      OR: [
        { resultImage: { startsWith: "/uploads/" } },
        { productImage: { startsWith: "/uploads/" } },
      ]
    }
  });
  console.log("users broken: " + remainingUsers);
  console.log("designs broken: " + remainingDesigns);
  console.log("tryonSessions broken: " + remainingTryons);

  await prisma.$disconnect();
  console.log("\nDone. All counts should be 0.");
}

main().catch((e) => {
  console.error("Backfill failed:", e);
  process.exit(1);
});
