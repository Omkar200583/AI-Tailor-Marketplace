import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";

export const notFound = (req: Request, _res: Response, next: NextFunction) =>
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  let status = 500;
  let message = "Internal server error";
  let details: unknown;

  if (err instanceof ApiError) {
    status = err.statusCode; message = err.message; details = err.details;
  } else if (err instanceof ZodError) {
    status = 400; message = "Validation failed";
    details = err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
  } else if (err?.name === "CastError") {
    status = 400; message = `Invalid ${err.path}`;
  } else if (err?.name === "ValidationError") {
    status = 400; message = "Validation failed";
    details = Object.values(err.errors).map((e: any) => ({ path: e.path, message: e.message }));
  } else if (err?.code === 11000) {
    status = 409; message = `Duplicate value for: ${Object.keys(err.keyValue || {}).join(", ")}`;
  } else if (err?.name === "JsonWebTokenError" || err?.name === "TokenExpiredError") {
    status = 401; message = "Invalid or expired token";
  } else if (err?.name === "MulterError") {
    status = 400; message = err.message;
  }

  if (status === 500) console.error(err);
  res.status(status).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(!env.isProd && status === 500 ? { stack: err?.stack } : {}),
  });
};
