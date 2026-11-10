import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../config/db";
import { User } from "../modules/users/user.model";
import { Category } from "../modules/categories/category.model";
import { slugify } from "../utils/slugify";

const categories = [
  { name: "Shirt", gender: "men", measurementFields: ["height", "chest", "waist", "shoulder", "sleeveLength", "neck"] },
  { name: "Trousers", gender: "men", measurementFields: ["waist", "hip", "inseam", "thigh"] },
  { name: "Kurta", gender: "unisex", measurementFields: ["height", "chest", "waist", "shoulder", "sleeveLength"] },
  { name: "Blouse", gender: "women", measurementFields: ["chest", "waist", "shoulder", "sleeveLength"] },
  { name: "Salwar Suit", gender: "women", measurementFields: ["height", "chest", "waist", "hip", "shoulder", "sleeveLength"] },
  { name: "Lehenga", gender: "women", measurementFields: ["chest", "waist", "hip", "height"] },
  { name: "Blazer", gender: "men", measurementFields: ["chest", "waist", "shoulder", "sleeveLength", "height"] },
  { name: "Kids Wear", gender: "kids", measurementFields: ["height", "chest", "waist"] },
];

(async () => {
  await connectDB();
  for (const c of categories) await Category.updateOne({ slug: slugify(c.name) }, { $setOnInsert: { ...c, slug: slugify(c.name) } }, { upsert: true });

  const email = process.env.ADMIN_EMAIL || "admin@aitailor.local";
  const password = process.env.ADMIN_PASSWORD || "ChangeMe@123";
  if (!(await User.exists({ email }))) {
    await User.create({ name: "Platform Admin", email, role: "admin", isVerified: true, passwordHash: await bcrypt.hash(password, 12) });
    console.log(`Admin created: ${email} / ${password}  (change this password!)`);
  }
  console.log("Seed complete");
  await mongoose.connection.close();
})();
