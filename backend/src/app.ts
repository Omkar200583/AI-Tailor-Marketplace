import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";

import { env } from "./config/env";
import api from "./modules";
import { apiLimiter } from "./middleware/rateLimit";
import { errorHandler, notFound } from "./middleware/error";

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = env.CLIENT_URL
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(compression());
app.use(morgan(env.isProd ? "combined" : "dev"));
app.use(cookieParser());

app.use(
  express.json({
    limit: "2mb",
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf;
    },
  })
);

app.use(express.urlencoded({ extended: true }));

// NOTE: /uploads static route removed — images now served from Cloudinary.
// Cloudinary URLs are absolute https URLs stored directly in MongoDB.

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "AI Tailor API is running",
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    uptime: process.uptime(),
  });
});

app.get("/api/v1", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "AI Tailor API v1 is running",
    version: "1.0.0",
  });
});

app.get("/api/v1/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    service: "AI Tailor Backend",
  });
});

app.use("/api/v1", apiLimiter, api);

app.use(notFound);
app.use(errorHandler);

export default app;
