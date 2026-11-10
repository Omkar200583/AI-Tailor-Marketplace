require("dotenv").config({ path: ".env.local" });

const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API Key present:", !!process.env.CLOUDINARY_API_KEY);
console.log("API Secret present:", !!process.env.CLOUDINARY_API_SECRET);

cloudinary.api.ping()
  .then(result => console.log("SUCCESS:", result))
  .catch(error => console.log("ERROR DETAILS:", error));
