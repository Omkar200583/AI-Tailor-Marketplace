require("dotenv").config();
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL;

if (!MONGODB_URI) {
  console.error("ERROR: MONGO_URI not set in backend/.env");
  process.exit(1);
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;

  async function tryUpdate(collectionName, filter, update) {
    try {
      const cols = await db.listCollections().toArray();
      if (!cols.some((c) => c.name === collectionName)) {
        console.log("  skip: collection '" + collectionName + "' does not exist");
        return 0;
      }
      const res = await db.collection(collectionName).updateMany(filter, update);
      console.log("  " + collectionName + ": matched " + res.matchedCount + ", modified " + res.modifiedCount);
      return res.matchedCount;
    } catch (e) {
      console.log("  " + collectionName + ": " + e.message);
      return 0;
    }
  }

  console.log("\n[1/4] Clearing broken profileImage on users...");
  await tryUpdate("users", { profileImage: /^\/uploads\// }, { $set: { profileImage: "" } });

  console.log("\n[2/4] Clearing broken url on userphotos/user_photos...");
  await tryUpdate("userphotos", { url: /^\/uploads\// }, { $set: { url: "" } });
  await tryUpdate("user_photos", { url: /^\/uploads\// }, { $set: { url: "" } });

  console.log("\n[3/4] Clearing broken imageUrl on designs...");
  await tryUpdate("designs", { imageUrl: /^\/uploads\// }, { $set: { imageUrl: "" } });

  console.log("\n[4/4] Cleaning broken images array on products...");
  try {
    const cols = await db.listCollections().toArray();
    if (cols.some((c) => c.name === "products")) {
      const broken = await db
        .collection("products")
        .find({ images: { $elemMatch: { $regex: /^\/uploads\// } } })
        .toArray();
      console.log("  Found " + broken.length + " products with broken image URLs");
      let fixed = 0;
      for (const p of broken) {
        const clean = (p.images || []).filter((u) => !u.startsWith("/uploads/"));
        await db.collection("products").updateOne({ _id: p._id }, { $set: { images: clean } });
        fixed++;
      }
      console.log("  Cleaned " + fixed + " products");
    } else {
      console.log("  skip: collection 'products' does not exist");
    }
  } catch (e) {
    console.log("  products: " + e.message);
  }

  console.log("\n--- Verification ---");
  async function count(name, filter) {
    try {
      return await db.collection(name).countDocuments(filter);
    } catch {
      return -1;
    }
  }
  console.log("users with broken profileImage: " + await count("users", { profileImage: /^\/uploads\// }));
  console.log("userphotos with broken url: " + await count("userphotos", { url: /^\/uploads\// }));
  console.log("designs with broken imageUrl: " + await count("designs", { imageUrl: /^\/uploads\// }));
  console.log("products with broken images: " + await count("products", { images: { $elemMatch: { $regex: /^\/uploads\// } } }));

  await mongoose.disconnect();
  console.log("\nDone. All counts should be 0.");
}

main().catch((e) => {
  console.error("Backfill failed:", e);
  process.exit(1);
});
