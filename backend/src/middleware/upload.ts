import multer from "multer";
import path from "path";
import crypto from "crypto";
import { ApiError } from "../utils/ApiError";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(process.cwd(), "uploads")),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${path.extname(file.originalname).toLowerCase()}`),
});

export const uploadImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpe?g|png|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(ApiError.badRequest("Only JPG, PNG or WEBP images are allowed"));
  },
});

export const fileUrl = (filename: string) => `/uploads/${filename}`;
