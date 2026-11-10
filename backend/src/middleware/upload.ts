import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "node:stream";
import { randomBytes } from "crypto";
import { ApiError } from "../utils/ApiError";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// In-memory storage — files never touch disk
export const uploadImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpe?g|png|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(ApiError.badRequest("Only JPG, PNG or WEBP images are allowed"));
  },
});

export const FOLDER = "ai-tailor/products";

export async function uploadToCloudinary(
  file: Express.Multer.File,
  folder: string = FOLDER,
): Promise<{ url: string; publicId: string }> {
  if (!file?.buffer) throw new Error("No file buffer");
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${Date.now()}-${randomBytes(6).toString("hex")}`,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary upload failed"));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    Readable.from(file.buffer).pipe(stream);
  });
}

export async function uploadMany(
  files: Express.Multer.File[] = [],
  folder: string = FOLDER,
): Promise<{ url: string; publicId: string }[]> {
  if (!files.length) return [];
  return Promise.all(files.map((f) => uploadToCloudinary(f, folder)));
}

// Legacy helper — kept so any unpatched caller still compiles, but
// never returns a /uploads/ URL again
export function fileUrl(filenameOrUrl: string): string {
  if (!filenameOrUrl) return "";
  if (filenameOrUrl.startsWith("http://") || filenameOrUrl.startsWith("https://")) {
    return filenameOrUrl;
  }
  return "";
}

export { cloudinary };
